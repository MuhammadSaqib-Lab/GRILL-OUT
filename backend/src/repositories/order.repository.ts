import { randomUUID } from "crypto";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import type { Order, OrderStatus, OrderType } from "../types/order.types";

export interface CreateOrderLine {
  menuItemId: number;
  optionLabel?: string;
  quantity: number;
}

export interface CreateOrderData {
  /** The logged-in account this order belongs to (from the session, never the client). */
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  orderType: OrderType;
  deliveryAddress?: string;
  specialInstructions?: string;
  /** Business decision (which flat fee applies to this orderType) made by
   * the service layer; the repository just persists it. */
  deliveryFee: number;
  lines: CreateOrderLine[];
}

export interface OrderRepository {
  /** Fetches menu items, verifies availability/options, prices every line
   * from the database, and writes Order + OrderItems in one transaction.
   * Throws ApiError (never partially writes) if any line is invalid. */
  createOrder(data: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | undefined>;
  /** Scoped by owner: returns undefined for someone else's order, exactly as
   * if it didn't exist (so ids can't be probed). */
  findByIdForCustomer(id: string, customerId: string): Promise<Order | undefined>;
  listByCustomer(customerId: string): Promise<Order[]>;
  /** `adminMessage` replaces any previous message; null/undefined clears it,
   * so a note never lingers on a status it wasn't written for. */
  updateStatus(id: string, status: OrderStatus, adminMessage?: string | null): Promise<Order>;
}

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function toDomainOrder(row: PrismaOrderWithItems): Order {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    ...(row.email ? { email: row.email } : {}),
    items: row.items.map((line) => ({
      menuItemId: line.menuItemId,
      name: line.itemNameSnapshot,
      ...(line.optionLabelSnapshot ? { optionLabel: line.optionLabelSnapshot } : {}),
      unitPrice: Number(line.unitPrice),
      quantity: line.quantity,
      subtotal: Number(line.subtotal),
    })),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.deliveryFee),
    total: Number(row.total),
    orderType: row.orderType,
    ...(row.deliveryAddress ? { deliveryAddress: row.deliveryAddress } : {}),
    ...(row.specialInstructions ? { specialInstructions: row.specialInstructions } : {}),
    ...(row.adminMessage ? { adminMessage: row.adminMessage } : {}),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const id = `ORD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    // Interactive transaction: if anything inside throws (bad item, race
    // condition where an item went unavailable, whatever), Prisma rolls
    // back everything written so far and re-throws — no partial order is
    // ever left behind. Prices are always read fresh from the database
    // here, never trusted from what the caller passed in.
    const created = await prisma.$transaction(async (tx) => {
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const line of data.lines) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: line.menuItemId },
          include: { options: true },
        });

        if (!menuItem) {
          throw ApiError.badRequest(`Menu item ${line.menuItemId} does not exist`);
        }
        if (!menuItem.isAvailable) {
          throw ApiError.badRequest(`"${menuItem.name}" is currently unavailable`);
        }

        let unitPrice: number;
        let optionLabelSnapshot: string | null = null;

        if (menuItem.options.length > 0) {
          if (!line.optionLabel) {
            throw ApiError.badRequest(`"${menuItem.name}" requires an option (e.g. size) to be selected`);
          }
          const option = menuItem.options.find((o) => o.label === line.optionLabel);
          if (!option) {
            throw ApiError.badRequest(`"${line.optionLabel}" is not a valid option for "${menuItem.name}"`);
          }
          unitPrice = Number(option.price);
          optionLabelSnapshot = option.label;
        } else {
          if (line.optionLabel) {
            throw ApiError.badRequest(`"${menuItem.name}" does not have selectable options`);
          }
          unitPrice = Number(menuItem.price);
        }

        orderItemsData.push({
          menuItemId: menuItem.id,
          itemNameSnapshot: menuItem.name,
          optionLabelSnapshot,
          unitPrice,
          quantity: line.quantity,
          subtotal: unitPrice * line.quantity,
        });
      }

      const subtotal = orderItemsData.reduce((sum, l) => sum + Number(l.subtotal), 0);
      const total = subtotal + data.deliveryFee;

      return tx.order.create({
        data: {
          id,
          customerId: data.customerId,
          customerName: data.customerName,
          phone: data.phone,
          email: data.email,
          subtotal,
          deliveryFee: data.deliveryFee,
          total,
          orderType: data.orderType,
          deliveryAddress: data.deliveryAddress,
          specialInstructions: data.specialInstructions,
          status: "PENDING",
          items: { createMany: { data: orderItemsData } },
        },
        include: { items: true },
      });
    });

    return toDomainOrder(created);
  }

  async findById(id: string): Promise<Order | undefined> {
    const row = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? toDomainOrder(row) : undefined;
  }

  async findByIdForCustomer(id: string, customerId: string): Promise<Order | undefined> {
    const row = await prisma.order.findFirst({ where: { id, customerId }, include: { items: true } });
    return row ? toDomainOrder(row) : undefined;
  }

  async listByCustomer(customerId: string): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(toDomainOrder);
  }

  async updateStatus(id: string, status: OrderStatus, adminMessage?: string | null): Promise<Order> {
    const row = await prisma.order.update({
      where: { id },
      data: { status, adminMessage: adminMessage ?? null },
      include: { items: true },
    });
    return toDomainOrder(row);
  }
}

export const orderRepository: OrderRepository = new PrismaOrderRepository();
