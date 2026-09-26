import { orderRepository } from "../repositories/order.repository";
import { env } from "../config/env";
import type { Order, OrderStatus } from "../types/order.types";
import type { AuthenticatedCustomer } from "../types/customer.types";
import type { CreateOrderInput } from "../validators/order.validator";
import { ApiError } from "../utils/ApiError";

// Only these transitions may be cancelled from — once food is in progress
// (or already resolved) a cancel request is a conflict, not a valid action.
const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export const orderService = {
  /** Business policy lives here (which delivery fee applies); the actual
   * fetch-verify-price-and-write-atomically sequence lives in the
   * repository, since it has to happen inside one database transaction. */
  async createOrder(input: CreateOrderInput, customer: AuthenticatedCustomer): Promise<Order> {
    const deliveryFee = input.orderType === "delivery" ? env.DELIVERY_FEE : 0;

    return orderRepository.createOrder({
      customerId: customer.id,
      customerName: customer.name,
      phone: input.phone,
      email: customer.email,
      orderType: input.orderType,
      deliveryAddress: input.deliveryAddress,
      specialInstructions: input.specialInstructions,
      deliveryFee,
      lines: input.items,
    });
  },

  /** Someone else's order is reported as not found — never as forbidden. */
  async getOrderForCustomer(id: string, customerId: string): Promise<Order> {
    const order = await orderRepository.findByIdForCustomer(id, customerId);
    if (!order) throw ApiError.notFound(`Order ${id} was not found`);
    return order;
  },

  listOrdersForCustomer(customerId: string): Promise<Order[]> {
    return orderRepository.listByCustomer(customerId);
  },

  async cancelOrder(id: string, customerId: string): Promise<Order> {
    const order = await this.getOrderForCustomer(id, customerId);
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw ApiError.conflict(`Order ${id} is "${order.status}" and can no longer be cancelled`);
    }
    const cancelled = await orderRepository.transition(id, CANCELLABLE_STATUSES, "CANCELLED", null);
    if (!cancelled) throw ApiError.conflict(`Order ${id} can no longer be cancelled`);
    return cancelled;
  },
};
