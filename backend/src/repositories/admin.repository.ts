/**
 * Admin-only Prisma queries, grouped by resource as named exports in one
 * file (see src/types/admin.types.ts for why — six new resources sharing
 * one "admin" concern didn't warrant six more one-file-per-resource repos).
 * The public repositories (menu/order/reservation) stay untouched and
 * read-only; admin write/list operations live here instead of being bolted
 * onto them, so the public API's behavior can never be affected by an
 * admin-side change.
 *
 * Order/Reservation status updates and single-record lookups are NOT
 * duplicated here — the existing `orderRepository`/`reservationRepository`
 * already do exactly that against the same database, so the admin
 * services call those directly.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import type {
  AdminCustomerSummary,
  AdminOrderSummary,
  AdminReservationSummary,
  DashboardStats,
  PaginatedResult,
  PaginationParams,
  PopularMenuItem,
} from "../types/admin.types";
import type { Category, MenuItem } from "../types/menu.types";

function paginate({ page, limit }: PaginationParams) {
  return { skip: (page - 1) * limit, take: limit };
}

function toResult<T>(items: T[], total: number, params: PaginationParams): PaginatedResult<T> {
  return {
    items,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

// ---------------------------------------------------------------------------
// Admin users (auth)
// ---------------------------------------------------------------------------

export const adminUserRepository = {
  findByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email } });
  },
  findById(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  },
};

// ---------------------------------------------------------------------------
// Orders (list/search/filter — status updates reuse orderRepository)
// ---------------------------------------------------------------------------

export interface AdminOrderListParams extends PaginationParams {
  status?: string;
  orderType?: string;
  search?: string;
}

export const adminOrderRepository = {
  async list(params: AdminOrderListParams): Promise<PaginatedResult<AdminOrderSummary>> {
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
      ...(params.orderType ? { orderType: params.orderType as Prisma.EnumOrderTypeFilter["equals"] } : {}),
      ...(params.search
        ? {
            OR: [
              { id: { contains: params.search, mode: "insensitive" } },
              { customerName: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: "desc" },
        ...paginate(params),
      }),
      prisma.order.count({ where }),
    ]);

    const items: AdminOrderSummary[] = rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      phone: row.phone,
      orderType: row.orderType,
      itemCount: row._count.items,
      total: Number(row.total),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));

    return toResult(items, total, params);
  },
};

// ---------------------------------------------------------------------------
// Reservations (list/filter — status updates reuse reservationRepository)
// ---------------------------------------------------------------------------

export interface AdminReservationListParams extends PaginationParams {
  status?: string;
  when?: "today" | "upcoming";
  search?: string;
}

export const adminReservationRepository = {
  async list(params: AdminReservationListParams): Promise<PaginatedResult<AdminReservationSummary>> {
    const todayStr = new Date().toISOString().slice(0, 10);

    const where: Prisma.ReservationWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumReservationStatusFilter["equals"] } : {}),
      ...(params.when === "today" ? { date: todayStr } : {}),
      ...(params.when === "upcoming" ? { date: { gte: todayStr } } : {}),
      ...(params.search
        ? {
            OR: [
              { customerName: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        orderBy: [{ date: "asc" }, { time: "asc" }],
        ...paginate(params),
      }),
      prisma.reservation.count({ where }),
    ]);

    const items: AdminReservationSummary[] = rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      phone: row.phone,
      ...(row.email ? { email: row.email } : {}),
      date: row.date,
      time: row.time,
      guests: row.guests,
      ...(row.specialRequests ? { specialRequests: row.specialRequests } : {}),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));

    return toResult(items, total, params);
  },
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface AdminCustomerListParams extends PaginationParams {
  search?: string;
}

export const adminCustomerRepository = {
  async list(params: AdminCustomerListParams): Promise<PaginatedResult<AdminCustomerSummary>> {
    const where: Prisma.CustomerWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: { select: { total: true, createdAt: true } },
          _count: { select: { reservations: true } },
        },
        orderBy: { createdAt: "desc" },
        ...paginate(params),
      }),
      prisma.customer.count({ where }),
    ]);

    const items: AdminCustomerSummary[] = rows.map((row) => {
      const totalSpent = row.orders.reduce((sum, o) => sum + Number(o.total), 0);
      const lastOrderAt = row.orders.length
        ? new Date(Math.max(...row.orders.map((o) => o.createdAt.getTime()))).toISOString()
        : null;

      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        ...(row.email ? { email: row.email } : {}),
        totalOrders: row.orders.length,
        totalSpent,
        lastOrderAt,
        reservationCount: row._count.reservations,
        createdAt: row.createdAt.toISOString(),
      };
    });

    return toResult(items, total, params);
  },
};

// ---------------------------------------------------------------------------
// Menu management (categories + items + options)
// ---------------------------------------------------------------------------

export interface CreateCategoryData {
  slug: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
}
export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}

export interface CreateMenuItemData {
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  options?: { label: string; price: number }[];
}
export type UpdateMenuItemData = Partial<CreateMenuItemData>;

const menuItemInclude = { options: true, category: true } as const;

function toDomainMenuItem(row: Prisma.MenuItemGetPayload<{ include: typeof menuItemInclude }>): MenuItem {
  const options = [...row.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({ label: o.label, price: Number(o.price) }));
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category.slug,
    image: row.image,
    available: row.isAvailable,
    featured: row.isFeatured,
    tags: row.tags,
    ...(options.length > 0 ? { options } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const adminMenuRepository = {
  async listCategoriesAdmin(): Promise<Category[]> {
    const rows = await prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map((c) => ({ key: c.slug, label: c.name }));
  },

  async listCategoriesFull() {
    return prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
  },

  async createCategory(data: CreateCategoryData) {
    return prisma.menuCategory.create({
      data: { slug: data.slug, name: data.name, description: data.description, image: data.image, sortOrder: data.sortOrder ?? 0 },
    });
  },

  async updateCategory(id: number, data: UpdateCategoryData) {
    return prisma.menuCategory.update({ where: { id }, data });
  },

  /** Deactivates instead of deleting if the category still has items —
   * never orphans/cascades over existing menu items. Returns which
   * action was actually taken. */
  async deleteOrDeactivateCategory(id: number): Promise<{ action: "deleted" | "deactivated" }> {
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      await prisma.menuCategory.update({ where: { id }, data: { isActive: false } });
      return { action: "deactivated" };
    }
    await prisma.menuCategory.delete({ where: { id } });
    return { action: "deleted" };
  },

  async listItemsAdmin(): Promise<MenuItem[]> {
    const rows = await prisma.menuItem.findMany({
      include: menuItemInclude,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });
    return rows.map(toDomainMenuItem);
  },

  async createItem(data: CreateMenuItemData): Promise<MenuItem> {
    const row = await prisma.menuItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        image: data.image,
        isAvailable: data.isAvailable ?? true,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
        ...(data.options && data.options.length > 0
          ? { options: { create: data.options.map((o, i) => ({ label: o.label, price: o.price, sortOrder: i })) } }
          : {}),
      },
      include: menuItemInclude,
    });
    return toDomainMenuItem(row);
  },

  async updateItem(id: number, data: UpdateMenuItemData): Promise<MenuItem> {
    const { options, ...rest } = data;

    await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({ where: { id }, data: rest });

      // Options are fully replaced on edit — the admin form always submits
      // the complete current set, so delete-then-recreate is simpler and
      // safer than diffing, and still idempotent-in-effect per save.
      if (options) {
        await tx.menuItemOption.deleteMany({ where: { menuItemId: id } });
        if (options.length > 0) {
          await tx.menuItemOption.createMany({
            data: options.map((o, i) => ({ menuItemId: id, label: o.label, price: o.price, sortOrder: i })),
          });
        }
      }
    });

    const row = await prisma.menuItem.findUniqueOrThrow({ where: { id }, include: menuItemInclude });
    return toDomainMenuItem(row);
  },

  /** Deactivates (isAvailable: false) instead of deleting if any historical
   * OrderItem references this item — never corrupts order history. */
  async deleteOrDeactivateItem(id: number): Promise<{ action: "deleted" | "deactivated" }> {
    const referenced = await prisma.orderItem.count({ where: { menuItemId: id } });
    if (referenced > 0) {
      await prisma.menuItem.update({ where: { id }, data: { isAvailable: false } });
      return { action: "deactivated" };
    }
    await prisma.menuItem.delete({ where: { id } });
    return { action: "deleted" };
  },
};

// ---------------------------------------------------------------------------
// Dashboard analytics
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

const ALL_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export const adminDashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const todayStr = now.toISOString().slice(0, 10);

    // Revenue intentionally excludes CANCELLED orders — a cancelled order
    // was never fulfilled and isn't real revenue.
    const revenueWhere = (gte: Date) => ({ createdAt: { gte }, status: { not: "CANCELLED" as const } });

    const [
      totalOrders,
      pendingOrders,
      todaysOrders,
      totalReservations,
      todaysReservations,
      totalCustomers,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      statusGroups,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { date: todayStr } }),
      prisma.customer.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: revenueWhere(todayStart) }),
      prisma.order.aggregate({ _sum: { total: true }, where: revenueWhere(weekStart) }),
      prisma.order.aggregate({ _sum: { total: true }, where: revenueWhere(monthStart) }),
      prisma.order.groupBy({ by: ["status"], _count: true }),
    ]);

    const ordersByStatus: Record<string, number> = Object.fromEntries(ALL_ORDER_STATUSES.map((s) => [s, 0]));
    for (const g of statusGroups) ordersByStatus[g.status] = g._count;

    return {
      totalOrders,
      pendingOrders,
      todaysOrders,
      totalReservations,
      todaysReservations,
      totalCustomers,
      revenueToday: Number(revenueToday._sum.total ?? 0),
      revenueThisWeek: Number(revenueThisWeek._sum.total ?? 0),
      revenueThisMonth: Number(revenueThisMonth._sum.total ?? 0),
      ordersByStatus,
    };
  },

  async getPopularItems(limit: number): Promise<PopularMenuItem[]> {
    const groups = await prisma.orderItem.groupBy({
      by: ["menuItemId", "itemNameSnapshot"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const ids = groups.map((g) => g.menuItemId).filter((id): id is number => id !== null);
    const currentItems = ids.length
      ? await prisma.menuItem.findMany({ where: { id: { in: ids } }, select: { id: true, image: true } })
      : [];
    const imageById = new Map(currentItems.map((i) => [i.id, i.image]));

    return groups.map((g) => ({
      menuItemId: g.menuItemId ?? 0,
      name: g.itemNameSnapshot,
      image: (g.menuItemId !== null ? imageById.get(g.menuItemId) : undefined) ?? "",
      quantitySold: g._sum.quantity ?? 0,
      revenue: Number(g._sum.subtotal ?? 0),
    }));
  },
};
