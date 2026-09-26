/**
 * Admin business logic, grouped by resource as named exports (see
 * src/types/admin.types.ts for why). Each service depends only on
 * repository interfaces/functions — reusing the existing public
 * `orderRepository`/`reservationRepository` for single-record lookups and
 * status writes rather than duplicating them.
 */
import {
  adminCustomerRepository,
  adminDashboardRepository,
  adminMenuRepository,
  adminOrderRepository,
  adminReservationRepository,
  adminUserRepository,
  type AdminCustomerListParams,
  type AdminOrderListParams,
  type AdminReservationListParams,
  type CreateCategoryData,
  type CreateMenuItemData,
  type UpdateCategoryData,
  type UpdateMenuItemData,
} from "../repositories/admin.repository";
import { orderRepository } from "../repositories/order.repository";
import { reservationRepository } from "../repositories/reservation.repository";
import { ApiError } from "../utils/ApiError";
import { signAdminToken } from "../utils/adminToken";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../utils/password";
import { slugify } from "../utils/slugify";
import type { AdminLoginInput } from "../validators/admin.validator";
import type { OrderStatus } from "../types/order.types";
import type { ReservationStatus } from "../types/reservation.types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const ORDER_TERMINAL: OrderStatus[] = ["COMPLETED", "CANCELLED"];
const ORDER_CANCELLABLE_FROM: OrderStatus[] = ["PENDING", "CONFIRMED"];
const ORDER_OPEN: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
const RESERVATION_OPEN: ReservationStatus[] = ["PENDING", "CONFIRMED"];
const RESERVATION_TERMINAL: ReservationStatus[] = ["COMPLETED", "CANCELLED"];
const RESERVATION_CANCELLABLE_FROM: ReservationStatus[] = ["PENDING", "CONFIRMED"];

export const adminAuthService = {
  async login(input: AdminLoginInput): Promise<{ token: string; profile: { id: string; email: string; name: string } }> {
    const admin = await adminUserRepository.findByEmail(input.email);
    // Same generic message — and, via burnPasswordCheck, the same amount of
    // work — whether the email doesn't exist or the password is wrong.
    if (!admin) {
      await burnPasswordCheck(input.password);
      throw ApiError.unauthorized("Invalid email or password.");
    }

    const valid = await verifyPassword(input.password, admin.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid email or password.");

    const token = signAdminToken({ sub: admin.id, email: admin.email, ver: admin.sessionVersion });
    return { token, profile: { id: admin.id, email: admin.email, name: admin.name } };
  },

  /** Revokes every token issued so far for this admin. Silent no-op for a
   * missing/invalid token — logging out twice, or with an expired cookie,
   * must not error. */
  async logout(adminId: string | undefined): Promise<void> {
    if (!adminId) return;
    await adminUserRepository.bumpSessionVersion(adminId);
  },

  async getProfile(adminId: string) {
    const admin = await adminUserRepository.findById(adminId);
    if (!admin) throw ApiError.notFound("Admin account no longer exists");
    return { id: admin.id, email: admin.email, name: admin.name };
  },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const adminOrderService = {
  list(params: AdminOrderListParams) {
    return adminOrderRepository.list(params);
  },

  async getById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw ApiError.notFound(`Order ${id} was not found`);
    return order;
  },

  /** `notify` says whether the customer should be emailed: only when the status
   * actually changed, or a new message was written — re-saving the same thing
   * must not send the same email twice. */
  async updateStatus(id: string, nextStatus: OrderStatus, message: string | null = null) {
    const order = await this.getById(id);

    if (ORDER_TERMINAL.includes(order.status)) {
      throw ApiError.conflict(`Order ${id} is already "${order.status}" and cannot be changed further`);
    }
    if (nextStatus === "CANCELLED" && !ORDER_CANCELLABLE_FROM.includes(order.status)) {
      throw ApiError.conflict(`Order ${id} can no longer be cancelled from status "${order.status}"`);
    }

    const previousMessage = order.adminMessage ?? null;
    if (order.status === nextStatus && previousMessage === message) return { order, notify: false };

    const updated = await orderRepository.transition(
      id,
      nextStatus === "CANCELLED" ? ORDER_CANCELLABLE_FROM : ORDER_OPEN,
      nextStatus,
      message
    );
    if (!updated) throw ApiError.conflict(`Order ${id} was just changed by someone else — refresh and try again`);

    return { order: updated, notify: order.status !== nextStatus || (message !== null && message !== previousMessage) };
  },
};

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export const adminReservationService = {
  list(params: AdminReservationListParams) {
    return adminReservationRepository.list(params);
  },

  async getById(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw ApiError.notFound(`Reservation ${id} was not found`);
    return reservation;
  },

  /** See adminOrderService.updateStatus for what `notify` means. */
  async updateStatus(id: string, nextStatus: ReservationStatus, message: string | null = null) {
    const reservation = await this.getById(id);

    if (RESERVATION_TERMINAL.includes(reservation.status)) {
      throw ApiError.conflict(`Reservation ${id} is already "${reservation.status}" and cannot be changed further`);
    }
    if (nextStatus === "CANCELLED" && !RESERVATION_CANCELLABLE_FROM.includes(reservation.status)) {
      throw ApiError.conflict(`Reservation ${id} can no longer be cancelled from status "${reservation.status}"`);
    }

    const previousMessage = reservation.adminMessage ?? null;
    if (reservation.status === nextStatus && previousMessage === message) return { reservation, notify: false };

    const updated = await reservationRepository.transition(
      id,
      nextStatus === "CANCELLED" ? RESERVATION_CANCELLABLE_FROM : RESERVATION_OPEN,
      nextStatus,
      message
    );
    if (!updated) throw ApiError.conflict(`Reservation ${id} was just changed by someone else — refresh and try again`);

    return {
      reservation: updated,
      notify: reservation.status !== nextStatus || (message !== null && message !== previousMessage),
    };
  },
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const adminCustomerService = {
  async getDetail(id: string) {
    const customer = await adminCustomerRepository.getDetail(id);
    if (!customer) throw ApiError.notFound("Customer was not found");
    return customer;
  },

  list(params: AdminCustomerListParams) {
    return adminCustomerRepository.list(params);
  },
};

// ---------------------------------------------------------------------------
// Menu management
// ---------------------------------------------------------------------------

export const adminMenuService = {
  listCategories() {
    return adminMenuRepository.listCategoriesFull();
  },

  async createCategory(data: { name: string; description?: string; image?: string; sortOrder?: number }) {
    const slug = slugify(data.name);
    const existing = await adminMenuRepository.listCategoriesAdmin();
    if (existing.some((c) => c.key === slug)) {
      throw ApiError.badRequest(`A category with slug "${slug}" already exists`);
    }
    const created: CreateCategoryData = { ...data, slug };
    return adminMenuRepository.createCategory(created);
  },

  updateCategory(id: number, data: UpdateCategoryData) {
    return adminMenuRepository.updateCategory(id, data);
  },

  deleteCategory(id: number) {
    return adminMenuRepository.deleteOrDeactivateCategory(id);
  },

  listItems() {
    return adminMenuRepository.listItemsAdmin();
  },

  async createItem(data: Omit<CreateMenuItemData, "slug">) {
    // Two dishes could share a display name in theory; only the generated
    // slug (used as a stable, human-readable key) needs to stay unique.
    const existing = await adminMenuRepository.listItemsAdmin();
    const existingSlugs = new Set(existing.map((i) => slugify(i.name)));
    let slug = slugify(data.name);
    let suffix = 2;
    while (existingSlugs.has(slug) && suffix < 50) {
      slug = `${slugify(data.name)}-${suffix++}`;
    }
    return adminMenuRepository.createItem({ ...data, slug });
  },

  updateItem(id: number, data: UpdateMenuItemData) {
    return adminMenuRepository.updateItem(id, data);
  },

  deleteItem(id: number) {
    return adminMenuRepository.deleteOrDeactivateItem(id);
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const adminDashboardService = {
  async getOverview() {
    const [stats, popularItems] = await Promise.all([
      adminDashboardRepository.getStats(),
      adminDashboardRepository.getPopularItems(5),
    ]);
    return { stats, popularItems };
  },
};

// Re-exported for the seed script (bootstraps the first admin user).
export { hashPassword };
