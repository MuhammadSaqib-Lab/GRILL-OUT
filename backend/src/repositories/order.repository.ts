import { randomUUID } from "crypto";
import type { Order } from "../types/order.types";

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | undefined>;
  update(order: Order): Promise<Order>;
  nextId(): string;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  nextId(): string {
    return `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async update(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
}

export const orderRepository: OrderRepository = new InMemoryOrderRepository();
