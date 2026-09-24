import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { registerCustomer, uniquePhone, type TestCustomer } from "./helpers";

const app = createApp();

let customer: TestCustomer;
beforeAll(async () => {
  customer = await registerCustomer(app, { name: "Ahmed Khan" });
});

describe("authentication is required", () => {
  it("rejects an anonymous order with 401 and creates nothing", async () => {
    const phone = uniquePhone(); // unique, so concurrent test files can't affect the count
    const res = await request(app)
      .post("/api/orders")
      .send({ phone, items: [{ menuItemId: 21, quantity: 1 }], orderType: "pickup" });
    expect(res.status).toBe(401);
    expect(await prisma.order.count({ where: { phone } })).toBe(0);
  });

  it("puts the order on the logged-in account, with name/email from the account", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({ phone: "0300-1234567", items: [{ menuItemId: 21, quantity: 1 }], orderType: "pickup", customerName: "Fake", email: "fake@example.com" });
    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe("Ahmed Khan");
    expect(res.body.data.email).toBe(customer.email);
    const row = await prisma.order.findUniqueOrThrow({ where: { id: res.body.data.id }, include: { customer: true } });
    expect(row.customer?.loginEmail).toBe(customer.email);
  });
});

describe("POST /api/orders", () => {
  it("creates a pickup order and computes the total server-side", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-1234567",
        items: [{ menuItemId: 21, quantity: 2 }], // Ba Zinga, Rs. 599 flat
        orderType: "pickup",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^ORD-/);
    expect(res.body.data.subtotal).toBe(1198);
    expect(res.body.data.deliveryFee).toBe(0);
    expect(res.body.data.total).toBe(1198);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("ignores any client-sent price and prices a sized item from the menu instead", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0311-2223334",
        items: [{ menuItemId: 1, optionLabel: "L", quantity: 1, price: 1 }], // Crown Crust L = 1949
        orderType: "pickup",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].unitPrice).toBe(1949);
    expect(res.body.data.total).toBe(1949);
  });

  it("adds the configured delivery fee for delivery orders", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-9998887",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "delivery",
        deliveryAddress: "House 12, Street 4, GT Road, Haripur",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.deliveryFee).toBe(150);
    expect(res.body.data.total).toBe(749);
  });

  it("rejects a delivery order with no address", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-0000000",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "delivery",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.deliveryAddress).toBeDefined();
  });

  it("rejects an order with a menu item that does not exist", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-1111111",
        items: [{ menuItemId: 999999, quantity: 1 }],
        orderType: "pickup",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects an order missing required fields", async () => {
    const res = await customer.agent.post("/api/orders").send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("database integrity", () => {
  it("keeps the historical unit price after the menu price changes", async () => {
    // Bump Zooper Beef's price after the order is placed — the order must
    // keep showing what the customer actually paid, not today's price.
    const original = await prisma.menuItem.findUniqueOrThrow({ where: { id: 30 } });

    const order = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-7654321",
        items: [{ menuItemId: 30, quantity: 1 }],
        orderType: "pickup",
      });
    expect(order.status).toBe(201);
    expect(order.body.data.items[0].unitPrice).toBe(Number(original.price));

    await prisma.menuItem.update({ where: { id: 30 }, data: { price: Number(original.price) + 500 } });

    const refetched = await customer.agent.get(`/api/customer/orders/${order.body.data.id}`);
    expect(refetched.body.data.items[0].unitPrice).toBe(Number(original.price));
    expect(refetched.body.data.subtotal).toBe(Number(original.price));

    // restore the seeded price so this test is repeatable
    await prisma.menuItem.update({ where: { id: 30 }, data: { price: original.price } });
  });

  it("rolls back the whole order if one line item in a multi-item order is invalid", async () => {
    // Scoped to this customer: other test files create orders concurrently.
    const mine = () => prisma.order.count({ where: { customer: { loginEmail: customer.email } } });
    const before = await mine();

    const res = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-1212121",
        items: [
          { menuItemId: 21, quantity: 1 }, // valid — Ba Zinga
          { menuItemId: 999999, quantity: 1 }, // invalid — does not exist
        ],
        orderType: "pickup",
      });

    expect(res.status).toBe(400);

    const after = await mine();
    expect(after).toBe(before); // no partial order was left behind

    const orphanItems = await prisma.orderItem.count({ where: { itemNameSnapshot: "Ba Zinga", order: { phone: "0300-1212121" } } });
    expect(orphanItems).toBe(0); // no orphaned OrderItem either
  });

  it("survives a menu item being deleted without corrupting the historical order", async () => {
    // A throwaway category + item, deleted after the order references it.
    const category = await prisma.menuCategory.create({
      data: { slug: `temp-${Date.now()}`, name: "Temp", sortOrder: 999 },
    });
    const throwaway = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: "Throwaway Special",
        slug: `throwaway-${Date.now()}`,
        description: "temp",
        price: 100,
        image: "https://example.com/x.jpg",
      },
    });

    const order = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-3213211",
        items: [{ menuItemId: throwaway.id, quantity: 1 }],
        orderType: "pickup",
      });
    expect(order.status).toBe(201);

    await prisma.menuItem.delete({ where: { id: throwaway.id } });

    const refetched = await customer.agent.get(`/api/customer/orders/${order.body.data.id}`);
    expect(refetched.status).toBe(200);
    expect(refetched.body.data.items[0].name).toBe("Throwaway Special");
    expect(refetched.body.data.items[0].menuItemId).toBeNull();

    await prisma.menuCategory.delete({ where: { id: category.id } });
  });
});

describe("GET /api/orders/:id and cancel", () => {
  it("fetches an order it just created, then cancels it, then refuses a second cancel", async () => {
    const created = await customer.agent
      .post("/api/orders")
      .send({
        phone: "0300-5551234",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "pickup",
      });
    const id = created.body.data.id;

    const fetched = await customer.agent.get(`/api/customer/orders/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const cancelled = await customer.agent.post(`/api/orders/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("CANCELLED");

    const secondCancel = await customer.agent.post(`/api/orders/${id}/cancel`);
    expect(secondCancel.status).toBe(409);
    expect(secondCancel.body.error.code).toBe("CONFLICT");
  });

  it("404s for an order id that was never created", async () => {
    const res = await customer.agent.get("/api/customer/orders/ORD-DOESNOTEXIST");
    expect(res.status).toBe(404);
  });
});
