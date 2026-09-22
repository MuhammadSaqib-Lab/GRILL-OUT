import { menuRepository } from "../repositories/menu.repository";
import { orderRepository } from "../repositories/order.repository";
import { env } from "../config/env";
import type { MenuItem } from "../types/menu.types";
import type { Order, OrderLine, OrderStatus } from "../types/order.types";
import type { CreateOrderInput } from "../validators/order.validator";
import { ApiError } from "../utils/ApiError";

// Only these transitions may be cancelled from — once food is in progress
// (or already resolved) a cancel request is a conflict, not a valid action.
const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

function priceOption(item: MenuItem, optionLabel: string | undefined): number {
  if (item.options) {
    if (!optionLabel) {
      throw ApiError.badRequest(`"${item.name}" requires an option (e.g. size) to be selected`);
    }
    const option = item.options.find((o) => o.label === optionLabel);
    if (!option) {
      throw ApiError.badRequest(`"${optionLabel}" is not a valid option for "${item.name}"`);
    }
    return option.price;
  }
  if (optionLabel) {
    throw ApiError.badRequest(`"${item.name}" does not have selectable options`);
  }
  return item.price;
}

export const orderService = {
  /** Resolves every line against the live menu repository — the client
   * only ever sends menuItemId + optionLabel + quantity, never a price.
   * This is the one place order totals are computed, on purpose. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const lines: OrderLine[] = [];

    for (const line of input.items) {
      const menuItem = await menuRepository.findById(line.menuItemId);
      if (!menuItem) {
        throw ApiError.badRequest(`Menu item ${line.menuItemId} does not exist`);
      }
      if (!menuItem.available) {
        throw ApiError.badRequest(`"${menuItem.name}" is currently unavailable`);
      }

      const unitPrice = priceOption(menuItem, line.optionLabel);
      lines.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        ...(line.optionLabel ? { optionLabel: line.optionLabel } : {}),
        unitPrice,
        quantity: line.quantity,
        lineTotal: unitPrice * line.quantity,
      });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const deliveryCharge = input.orderType === "delivery" ? env.DELIVERY_FEE : 0;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderRepository.nextId(),
      customerName: input.customerName,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      items: lines,
      subtotal,
      deliveryCharge,
      total: subtotal + deliveryCharge,
      orderType: input.orderType,
      ...(input.deliveryAddress ? { deliveryAddress: input.deliveryAddress } : {}),
      ...(input.specialInstructions ? { specialInstructions: input.specialInstructions } : {}),
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    return orderRepository.create(order);
  },

  async getOrderById(id: string): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound(`Order ${id} was not found`);
    }
    return order;
  },

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw ApiError.conflict(`Order ${id} is "${order.status}" and can no longer be cancelled`);
    }
    order.status = "CANCELLED";
    order.updatedAt = new Date().toISOString();
    return orderRepository.update(order);
  },
};
