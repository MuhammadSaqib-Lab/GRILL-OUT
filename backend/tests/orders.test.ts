import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("POST /api/orders", () => {
  it("creates a pickup order and computes the total server-side", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Ahmed Khan",
        phone: "0300-1234567",
        items: [{ menuItemId: 21, quantity: 2 }], // Ba Zinga, Rs. 599 flat
        orderType: "pickup",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^ORD-/);
    expect(res.body.data.subtotal).toBe(1198);
    expect(res.body.data.deliveryCharge).toBe(0);
    expect(res.body.data.total).toBe(1198);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("ignores any client-sent price and prices a sized item from the menu instead", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Sana Riaz",
        phone: "0311-2223334",
        items: [{ menuItemId: 1, optionLabel: "L", quantity: 1, price: 1 }], // Crown Crust L = 1949
        orderType: "pickup",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].unitPrice).toBe(1949);
    expect(res.body.data.total).toBe(1949);
  });

  it("adds the configured delivery fee for delivery orders", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Bilal Hussain",
        phone: "0300-9998887",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "delivery",
        deliveryAddress: "House 12, Street 4, GT Road, Haripur",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.deliveryCharge).toBe(150);
    expect(res.body.data.total).toBe(749);
  });

  it("rejects a delivery order with no address", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerName: "No Address",
        phone: "0300-0000000",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "delivery",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.deliveryAddress).toBeDefined();
  });

  it("rejects an order with a menu item that does not exist", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Ghost Item",
        phone: "0300-1111111",
        items: [{ menuItemId: 999999, quantity: 1 }],
        orderType: "pickup",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects an order missing required fields", async () => {
    const res = await request(app).post("/api/orders").send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/orders/:id and cancel", () => {
  it("fetches an order it just created, then cancels it, then refuses a second cancel", async () => {
    const created = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Cancel Flow",
        phone: "0300-5551234",
        items: [{ menuItemId: 21, quantity: 1 }],
        orderType: "pickup",
      });
    const id = created.body.data.id;

    const fetched = await request(app).get(`/api/orders/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const cancelled = await request(app).post(`/api/orders/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("CANCELLED");

    const secondCancel = await request(app).post(`/api/orders/${id}/cancel`);
    expect(secondCancel.status).toBe(409);
    expect(secondCancel.body.error.code).toBe("CONFLICT");
  });

  it("404s for an order id that was never created", async () => {
    const res = await request(app).get("/api/orders/ORD-DOESNOTEXIST");
    expect(res.status).toBe(404);
  });
});
