import { orderRepository } from "../repositories/order.repository";
import { env } from "../config/env";
import type { Order, OrderStatus } from "../types/order.types";
import type { CreateOrderInput } from "../validators/order.validator";
import { ApiError } from "../utils/ApiError";

// Only these transitions may be cancelled from — once food is in progress
// (or already resolved) a cancel request is a conflict, not a valid action.
const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export const orderService = {
  /** Business policy lives here (which delivery fee applies); the actual
   * fetch-verify-price-and-write-atomically sequence lives in the
   * repository, since it has to happen inside one database transaction. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const deliveryFee = input.orderType === "delivery" ? env.DELIVERY_FEE : 0;

    return orderRepository.createOrder({
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      orderType: input.orderType,
      deliveryAddress: input.deliveryAddress,
      specialInstructions: input.specialInstructions,
      deliveryFee,
      lines: input.items,
    });
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
    return orderRepository.updateStatus(id, "CANCELLED");
  },
};
