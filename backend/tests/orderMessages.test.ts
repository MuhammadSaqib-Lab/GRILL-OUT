import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { adminCookie } from "../src/utils/adminToken";
import { adminCookieHeader, orderBody, registerCustomer, type TestCustomer } from "./helpers";

const app = createApp();

let customer: TestCustomer;
beforeAll(async () => {
  customer = await registerCustomer(app, { name: "Message Test" });
});

async function placeOrder() {
  const res = await customer.agent.post("/api/orders").send(orderBody());
  expect(res.status).toBe(201);
  return res.body.data as { id: string; total: number };
}

async function setStatus(id: string, body: Record<string, unknown>) {
  return request(app)
    .patch(`/api/admin/orders/${id}/status`)
    .set("Cookie", await adminCookieHeader())
    .send(body);
}

const customerView = (id: string) => customer.agent.get(`/api/customer/orders/${id}`);

describe("admin order status messages", () => {
  it("1. confirms an order without a message (message stays null)", async () => {
    const order = await placeOrder();
    const res = await setStatus(order.id, { status: "CONFIRMED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CONFIRMED");
    expect(res.body.data.adminMessage).toBeUndefined();

    const row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.adminMessage).toBeNull();
  });

  it("2. confirms an order with a message, saves it, and the customer can read it", async () => {
    const order = await placeOrder();
    const text = "Your order has been confirmed and is now being prepared.";
    const res = await setStatus(order.id, { status: "CONFIRMED", message: text });
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBe(text);

    const row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.adminMessage).toBe(text);

    // 14. customer viewing the message
    const seen = await customerView(order.id);
    expect(seen.status).toBe(200);
    expect(seen.body.data.status).toBe("CONFIRMED");
    expect(seen.body.data.adminMessage).toBe(text);
  });

  it("3. cancels an order without a message", async () => {
    const order = await placeOrder();
    const res = await setStatus(order.id, { status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
    expect(res.body.data.adminMessage).toBeUndefined();
  });

  it("4. cancels with a reason — the order row is kept, never deleted", async () => {
    const order = await placeOrder();
    const before = await prisma.order.count();
    const reason = "Sorry, we are currently unable to deliver to your area.";
    const res = await setStatus(order.id, { status: "CANCELLED", message: reason });
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBe(reason);

    expect(await prisma.order.count()).toBeGreaterThanOrEqual(before);
    const row = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    expect(row).not.toBeNull();
    expect(row?.status).toBe("CANCELLED");
    expect(row?.items).toHaveLength(1);

    const seen = await customerView(order.id);
    expect(seen.body.data.status).toBe("CANCELLED");
    expect(seen.body.data.adminMessage).toBe(reason);
  });

  it("5-7. PREPARING, READY and COMPLETED each carry their own message, replacing the last", async () => {
    const order = await placeOrder();

    for (const [status, message] of [
      ["PREPARING", "Your food is on the grill."],
      ["READY", "Your order is ready for pickup."],
      ["COMPLETED", "Thank you — enjoy your meal!"],
    ] as const) {
      const res = await setStatus(order.id, { status, message });
      expect(res.status, status).toBe(200);
      expect(res.body.data.status).toBe(status);
      expect(res.body.data.adminMessage).toBe(message);
      const seen = await customerView(order.id);
      expect(seen.body.data.adminMessage).toBe(message);
    }
  });

  it("OUT_FOR_DELIVERY accepts a message too", async () => {
    const order = await placeOrder();
    const res = await setStatus(order.id, { status: "OUT_FOR_DELIVERY", message: "Rider is on the way." });
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBe("Rider is on the way.");
  });

  it("a status change with no message clears the previous one (it never lingers on the wrong status)", async () => {
    const order = await placeOrder();
    await setStatus(order.id, { status: "CONFIRMED", message: "Confirmed — thanks!" });
    const res = await setStatus(order.id, { status: "PREPARING" });
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBeUndefined();

    const seen = await customerView(order.id);
    expect(seen.body.data.status).toBe("PREPARING");
    expect(seen.body.data.adminMessage).toBeUndefined();
    expect(JSON.stringify(seen.body)).not.toMatch(/null|undefined/);
  });

  it("8. treats empty, whitespace-only and null messages as no message", async () => {
    for (const message of ["", "   \n\t ", null]) {
      const order = await placeOrder();
      const res = await setStatus(order.id, { status: "CONFIRMED", message });
      expect(res.status, JSON.stringify(message)).toBe(200);
      const row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(row.adminMessage).toBeNull();
    }
  });

  it("trims surrounding whitespace but keeps the text and inner line breaks", async () => {
    const order = await placeOrder();
    const res = await setStatus(order.id, { status: "CONFIRMED", message: "  Line one\nLine two  " });
    expect(res.body.data.adminMessage).toBe("Line one\nLine two");
  });

  it("9. accepts exactly 500 characters and rejects 501", async () => {
    const order = await placeOrder();
    const ok = await setStatus(order.id, { status: "CONFIRMED", message: "a".repeat(500) });
    expect(ok.status).toBe(200);
    expect(ok.body.data.adminMessage).toHaveLength(500);

    const order2 = await placeOrder();
    const tooLong = await setStatus(order2.id, { status: "CONFIRMED", message: "a".repeat(501) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.error.code).toBe("VALIDATION_ERROR");
    expect(tooLong.body.error.details.message).toBeDefined();

    // a rejected request must change nothing
    const row = await prisma.order.findUniqueOrThrow({ where: { id: order2.id } });
    expect(row.status).toBe("PENDING");
    expect(row.adminMessage).toBeNull();
  });

  it("10. rejects an invalid status, with or without a message", async () => {
    const order = await placeOrder();
    for (const body of [{ status: "SHIPPED" }, { status: "confirmed", message: "hi" }, { message: "no status" }, {}]) {
      const res = await setStatus(order.id, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it("rejects a message that isn't a string, or that contains a NUL byte", async () => {
    const order = await placeOrder();
    for (const message of [123, true, { text: "x" }, ["a"], "bad\u0000byte"]) {
      const res = await setStatus(order.id, { status: "CONFIRMED", message });
      expect(res.status, JSON.stringify(message)).toBe(400);
    }
  });

  it("does not let a message rewrite anything else about the order", async () => {
    const order = await placeOrder();
    const res = await setStatus(order.id, {
      status: "CONFIRMED",
      message: "ok",
      total: 1,
      subtotal: 1,
      customerName: "Hacked",
      adminMessage: "sneaky",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(order.total);
    expect(res.body.data.customerName).toBe("Message Test");
    expect(res.body.data.adminMessage).toBe("ok");
  });

  it("11. rejects unauthenticated requests and forged/other cookies", async () => {
    const order = await placeOrder();
    const none = await request(app).patch(`/api/admin/orders/${order.id}/status`).send({ status: "CONFIRMED", message: "x" });
    expect(none.status).toBe(401);

    const forged = jwt.sign({ sub: "x", email: "a@b.co", ver: 0 }, "not-the-real-secret-not-the-real-secret", { algorithm: "HS256" });
    const bad = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set("Cookie", `${adminCookie.name}=${forged}`)
      .send({ status: "CONFIRMED", message: "x" });
    expect(bad.status).toBe(401);

    const row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.status).toBe("PENDING");
    expect(row.adminMessage).toBeNull();
  });

  it("12. a customer cannot set a message or status through any public endpoint", async () => {
    // creating an order with an adminMessage/status is ignored
    const created = await customer.agent
      .post("/api/orders")
      .send(orderBody({ adminMessage: "Free food, approved by admin", status: "COMPLETED" }));
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("PENDING");
    expect(created.body.data.adminMessage).toBeUndefined();
    const row = await prisma.order.findUniqueOrThrow({ where: { id: created.body.data.id } });
    expect(row.adminMessage).toBeNull();

    // there is no customer-facing way to update an order's status/message
    const id = created.body.data.id;
    for (const path of [`/api/orders/${id}`, `/api/customer/orders/${id}`]) {
      for (const method of ["patch", "put"] as const) {
        const res = await customer.agent[method](path).send({ status: "COMPLETED", adminMessage: "hi" });
        expect(res.status, `${method} ${path}`).toBe(404);
      }
    }
    // the admin route rejects a customer session outright
    const viaAdminPath = await customer.agent.patch(`/api/admin/orders/${id}/status`).send({ status: "COMPLETED", message: "hi" });
    expect(viaAdminPath.status).toBe(401);

    // the owner's own cancel ignores any body and clears the admin's note
    await setStatus(id, { status: "CONFIRMED", message: "Confirmed by admin" });
    const cancel = await customer.agent.post(`/api/orders/${id}/cancel`).send({ adminMessage: "I set this", message: "me too" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.adminMessage).toBeUndefined();
    const after = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(after.adminMessage).toBeNull();
  });

  it("13. an XSS-style message is stored and returned as inert text, verbatim", async () => {
    const order = await placeOrder();
    const payload = `<img src=x onerror="alert(1)"><script>alert('xss')</script> & "quotes"`;
    const res = await setStatus(order.id, { status: "CONFIRMED", message: payload });
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBe(payload);

    const seen = await customerView(order.id);
    expect(seen.body.data.adminMessage).toBe(payload);
    // Only ever delivered as JSON — never as an HTML document.
    expect(seen.headers["content-type"]).toMatch(/application\/json/);
    expect(seen.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("the customer's own view carries the message and nothing internal", async () => {
    const order = await placeOrder();
    await setStatus(order.id, { status: "CONFIRMED", message: "See you soon." });
    const seen = await customerView(order.id);
    expect(seen.body.data.adminMessage).toBe("See you soon.");
    expect(JSON.stringify(seen.body)).not.toMatch(/passwordHash|sessionVersion|customerId|loginEmail/);
  });

  it("admin order detail includes the message", async () => {
    const order = await placeOrder();
    await setStatus(order.id, { status: "CONFIRMED", message: "Visible in admin" });
    const res = await request(app).get(`/api/admin/orders/${order.id}`).set("Cookie", await adminCookieHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.adminMessage).toBe("Visible in admin");
  });

  it("existing rules still hold: a finished order can't be changed, and an order can't be cancelled once preparing", async () => {
    const done = await placeOrder();
    await setStatus(done.id, { status: "COMPLETED", message: "Done" });
    const again = await setStatus(done.id, { status: "CONFIRMED", message: "reopen?" });
    expect(again.status).toBe(409);
    const row = await prisma.order.findUniqueOrThrow({ where: { id: done.id } });
    expect(row.adminMessage).toBe("Done"); // rejected change wrote nothing

    const cooking = await placeOrder();
    await setStatus(cooking.id, { status: "PREPARING" });
    const cancel = await setStatus(cooking.id, { status: "CANCELLED", message: "too late" });
    expect(cancel.status).toBe(409);
  });

  it("historical prices are unaffected by status/message changes", async () => {
    const order = await placeOrder();
    await setStatus(order.id, { status: "CONFIRMED", message: "hello" });
    const seen = await customerView(order.id);
    expect(seen.body.data.items[0].unitPrice).toBe(599);
    expect(seen.body.data.total).toBe(order.total);
    expect(seen.body.data.total).toBe(1198);
  });
});
