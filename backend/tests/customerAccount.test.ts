import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { linkLegacyRecords } from "../src/services/legacyLink.service";
import { adminCookieHeader, orderBody, registerCustomer, reservationBody, uniqueEmail, uniquePhone, type TestCustomer } from "./helpers";

const app = createApp();

let alice: TestCustomer;
let bob: TestCustomer;
beforeAll(async () => {
  alice = await registerCustomer(app, { name: "Alice Anderson" });
  bob = await registerCustomer(app, { name: "Bob Brown" });
});

async function adminSetOrder(id: string, body: Record<string, unknown>) {
  return request(app).patch(`/api/admin/orders/${id}/status`).set("Cookie", await adminCookieHeader()).send(body);
}
async function adminSetReservation(id: string, body: Record<string, unknown>) {
  return request(app).patch(`/api/admin/reservations/${id}/status`).set("Cookie", await adminCookieHeader()).send(body);
}

describe("orders belong to the logged-in customer", () => {
  it("attaches a new order to the session's customer, whatever the body claims", async () => {
    const aliceRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: alice.email } });
    const bobRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: bob.email } });

    // Alice tries to place an order "for" Bob by sending Bob's ids/emails.
    const res = await alice.agent
      .post("/api/orders")
      .send(orderBody({ customerId: bobRow.id, customer: { id: bobRow.id }, email: bob.email, customerName: "Bob Brown" }));
    expect(res.status).toBe(201);

    const row = await prisma.order.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.customerId).toBe(aliceRow.id);
    expect(row.customerName).toBe("Alice Anderson");
    expect(row.email).toBe(alice.email);
  });

  it("lists only the customer's own orders, newest first, with items, totals and status", async () => {
    const mine = await alice.agent.post("/api/orders").send(orderBody({ items: [{ menuItemId: 21, quantity: 3 }] }));
    const theirs = await bob.agent.post("/api/orders").send(orderBody());

    const list = await alice.agent.get("/api/customer/orders");
    expect(list.status).toBe(200);
    const ids = list.body.data.map((o: { id: string }) => o.id);
    expect(ids[0]).toBe(mine.body.data.id);
    expect(ids).not.toContain(theirs.body.data.id);

    const first = list.body.data[0];
    expect(first.status).toBe("PENDING");
    expect(first.total).toBe(1797);
    expect(first.items[0]).toMatchObject({ name: "Ba Zinga", quantity: 3, unitPrice: 599 });
    expect(list.body.data.every((o: { customerName: string }) => o.customerName === "Alice Anderson")).toBe(true);
  });

  it("does not trust a customerId query/body/header — the list is always the session's own", async () => {
    const bobRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: bob.email } });
    const bobOrder = await bob.agent.post("/api/orders").send(orderBody());

    for (const url of [`/api/customer/orders?customerId=${bobRow.id}`, `/api/customer/orders?customer=${bobRow.id}&email=${bob.email}`]) {
      const res = await alice.agent.get(url).set("X-Customer-Id", bobRow.id);
      expect(res.status).toBe(200);
      expect(res.body.data.map((o: { id: string }) => o.id)).not.toContain(bobOrder.body.data.id);
    }
  });

  it("IDOR: another customer's order looks exactly like a missing one (404), for read and cancel", async () => {
    const aliceOrder = await alice.agent.post("/api/orders").send(orderBody());
    const id = aliceOrder.body.data.id;

    const peek = await bob.agent.get(`/api/customer/orders/${id}`);
    const missing = await bob.agent.get("/api/customer/orders/ORD-AAAAAAAAAAAA");
    expect(peek.status).toBe(404);
    expect(peek.body.error.code).toBe(missing.body.error.code);

    const cancel = await bob.agent.post(`/api/orders/${id}/cancel`);
    expect(cancel.status).toBe(404);
    const row = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("PENDING"); // Bob could not touch it

    expect((await request(app).get(`/api/customer/orders/${id}`)).status).toBe(401);
    expect((await alice.agent.get(`/api/customer/orders/${id}`)).status).toBe(200);
  });

  it("an admin status change shows up on the customer's account immediately, with the admin's message", async () => {
    const order = await alice.agent.post("/api/orders").send(orderBody());
    const id = order.body.data.id;

    let seen = await alice.agent.get(`/api/customer/orders/${id}`);
    expect(seen.body.data.status).toBe("PENDING");
    expect(seen.body.data).not.toHaveProperty("adminMessage");

    const confirm = await adminSetOrder(id, { status: "CONFIRMED", message: "Confirmed — ready in 25 minutes." });
    expect(confirm.status).toBe(200);
    seen = await alice.agent.get(`/api/customer/orders/${id}`);
    expect(seen.body.data.status).toBe("CONFIRMED");
    expect(seen.body.data.adminMessage).toBe("Confirmed — ready in 25 minutes.");

    // shows in the list too
    const list = await alice.agent.get("/api/customer/orders");
    expect(list.body.data.find((o: { id: string }) => o.id === id).adminMessage).toBe("Confirmed — ready in 25 minutes.");
  });

  it("a cancellation with no message shows Cancelled and no message at all", async () => {
    const order = await alice.agent.post("/api/orders").send(orderBody());
    await adminSetOrder(order.body.data.id, { status: "CANCELLED" });
    const seen = await alice.agent.get(`/api/customer/orders/${order.body.data.id}`);
    expect(seen.body.data.status).toBe("CANCELLED");
    expect(seen.body.data).not.toHaveProperty("adminMessage");
    expect(JSON.stringify(seen.body)).not.toMatch(/null|undefined/);
  });

  it("a cancellation with a reason shows the reason; the order row is kept", async () => {
    const order = await alice.agent.post("/api/orders").send(orderBody());
    const id = order.body.data.id;
    await adminSetOrder(id, { status: "CANCELLED", message: "Sorry, an item is out of stock." });
    const seen = await alice.agent.get(`/api/customer/orders/${id}`);
    expect(seen.body.data.adminMessage).toBe("Sorry, an item is out of stock.");
    expect(await prisma.order.findUnique({ where: { id } })).not.toBeNull();
  });

  it("an XSS-style admin message is returned as inert JSON text", async () => {
    const order = await alice.agent.post("/api/orders").send(orderBody());
    const payload = `<img src=x onerror=alert(1)><script>alert(2)</script>`;
    await adminSetOrder(order.body.data.id, { status: "CONFIRMED", message: payload });
    const seen = await alice.agent.get(`/api/customer/orders/${order.body.data.id}`);
    expect(seen.body.data.adminMessage).toBe(payload);
    expect(seen.headers["content-type"]).toMatch(/application\/json/);
    expect(seen.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("historical prices stay correct after the menu price changes", async () => {
    const order = await alice.agent.post("/api/orders").send(orderBody({ items: [{ menuItemId: 30, quantity: 1 }] }));
    const original = await prisma.menuItem.findUniqueOrThrow({ where: { id: 30 } });
    await prisma.menuItem.update({ where: { id: 30 }, data: { price: Number(original.price) + 500 } });
    try {
      const seen = await alice.agent.get(`/api/customer/orders/${order.body.data.id}`);
      expect(seen.body.data.items[0].unitPrice).toBe(Number(original.price));
    } finally {
      await prisma.menuItem.update({ where: { id: 30 }, data: { price: original.price } });
    }
  });
});

describe("reservations belong to the logged-in customer", () => {
  it("attaches a new reservation to the session's customer and uses the account's name/email", async () => {
    const aliceRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: alice.email } });
    const bobRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: bob.email } });

    const res = await alice.agent
      .post("/api/reservations")
      .send(reservationBody({ customerId: bobRow.id, customerName: "Bob Brown", email: bob.email }));
    expect(res.status).toBe(201);
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.customerId).toBe(aliceRow.id);
    expect(row.customerName).toBe("Alice Anderson");
    expect(row.email).toBe(alice.email);
  });

  it("lists only the customer's own reservations", async () => {
    const mine = await alice.agent.post("/api/reservations").send(reservationBody());
    const theirs = await bob.agent.post("/api/reservations").send(reservationBody());

    const list = await alice.agent.get("/api/customer/reservations");
    expect(list.status).toBe(200);
    const ids = list.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(mine.body.data.id);
    expect(ids).not.toContain(theirs.body.data.id);
    expect(list.body.data[0]).toMatchObject({ status: "PENDING", guests: "3-4", time: "19:30" });
  });

  it("IDOR: another customer's reservation is a 404, for read and cancel", async () => {
    const res = await alice.agent.post("/api/reservations").send(reservationBody());
    const id = res.body.data.id;

    expect((await bob.agent.get(`/api/customer/reservations/${id}`)).status).toBe(404);
    expect((await bob.agent.post(`/api/reservations/${id}/cancel`)).status).toBe(404);
    expect((await request(app).get(`/api/customer/reservations/${id}`)).status).toBe(401);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id } })).status).toBe("PENDING");
    expect((await alice.agent.get(`/api/customer/reservations/${id}`)).status).toBe(200);
  });

  it("admin confirmation appears for the customer, with the message", async () => {
    const res = await alice.agent.post("/api/reservations").send(reservationBody());
    const id = res.body.data.id;

    const confirm = await adminSetReservation(id, { status: "CONFIRMED", message: "Your table is reserved. See you at 7:30!" });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.adminMessage).toBe("Your table is reserved. See you at 7:30!");

    const seen = await alice.agent.get(`/api/customer/reservations/${id}`);
    expect(seen.body.data.status).toBe("CONFIRMED");
    expect(seen.body.data.adminMessage).toBe("Your table is reserved. See you at 7:30!");
  });

  it("admin cancellation appears, with and without a reason; a later status change without a message clears the note", async () => {
    const withReason = await alice.agent.post("/api/reservations").send(reservationBody());
    await adminSetReservation(withReason.body.data.id, { status: "CANCELLED", message: "We are fully booked that evening." });
    let seen = await alice.agent.get(`/api/customer/reservations/${withReason.body.data.id}`);
    expect(seen.body.data.status).toBe("CANCELLED");
    expect(seen.body.data.adminMessage).toBe("We are fully booked that evening.");

    const noReason = await alice.agent.post("/api/reservations").send(reservationBody());
    await adminSetReservation(noReason.body.data.id, { status: "CANCELLED" });
    seen = await alice.agent.get(`/api/customer/reservations/${noReason.body.data.id}`);
    expect(seen.body.data.status).toBe("CANCELLED");
    expect(seen.body.data).not.toHaveProperty("adminMessage");

    const cleared = await alice.agent.post("/api/reservations").send(reservationBody());
    await adminSetReservation(cleared.body.data.id, { status: "CONFIRMED", message: "temp note" });
    await adminSetReservation(cleared.body.data.id, { status: "COMPLETED" });
    seen = await alice.agent.get(`/api/customer/reservations/${cleared.body.data.id}`);
    expect(seen.body.data).not.toHaveProperty("adminMessage");
  });

  it("validates reservation messages like order messages (500 max, plain text, invalid status rejected)", async () => {
    const res = await alice.agent.post("/api/reservations").send(reservationBody());
    const id = res.body.data.id;
    expect((await adminSetReservation(id, { status: "CONFIRMED", message: "a".repeat(501) })).status).toBe(400);
    expect((await adminSetReservation(id, { status: "CONFIRMED", message: 42 })).status).toBe(400);
    expect((await adminSetReservation(id, { status: "MAYBE", message: "x" })).status).toBe(400);
    const xss = await adminSetReservation(id, { status: "CONFIRMED", message: "<script>alert(1)</script>" });
    expect(xss.body.data.adminMessage).toBe("<script>alert(1)</script>");
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id } })).status).toBe("CONFIRMED");
  });

  it("a customer cannot change a reservation's status or message except by cancelling their own", async () => {
    const res = await alice.agent.post("/api/reservations").send(reservationBody());
    const id = res.body.data.id;
    for (const method of ["patch", "put"] as const) {
      expect((await alice.agent[method](`/api/customer/reservations/${id}`).send({ status: "CONFIRMED", adminMessage: "x" })).status).toBe(404);
    }
    expect((await alice.agent.patch(`/api/admin/reservations/${id}/status`).send({ status: "CONFIRMED", message: "x" })).status).toBe(401);
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id } })).status).toBe("PENDING");
  });
});

describe("legacy (pre-account) data is safe", () => {
  it("is never exposed to a new account that signs up with the same email", async () => {
    const email = uniqueEmail("legacy");
    const guest = await prisma.customer.create({ data: { name: "Old Guest", phone: uniquePhone(), email } });
    const oldOrder = await prisma.order.create({
      data: {
        id: `ORD-LEGACY${Date.now().toString().slice(-6)}`,
        customerId: guest.id,
        customerName: "Old Guest",
        phone: guest.phone ?? "0300-0000000",
        email,
        subtotal: 599,
        total: 599,
        orderType: "pickup",
        items: { create: [{ itemNameSnapshot: "Ba Zinga", unitPrice: 599, quantity: 1, subtotal: 599 }] },
      },
    });

    const fresh = await registerCustomer(app, { email, name: "New Account" });
    const list = await fresh.agent.get("/api/customer/orders");
    expect(list.body.data).toEqual([]);
    expect((await fresh.agent.get(`/api/customer/orders/${oldOrder.id}`)).status).toBe(404);
    // …and nothing was modified or deleted
    expect((await prisma.order.findUniqueOrThrow({ where: { id: oldOrder.id } })).customerId).toBe(guest.id);
  });

  it("can be linked to an account only by the explicit operator step (dry run first, then apply)", async () => {
    const email = uniqueEmail("linkme");
    const guest = await prisma.customer.create({ data: { name: "Guest", phone: uniquePhone(), email } });
    const orderId = `ORD-LINK${Date.now().toString().slice(-7)}`;
    await prisma.order.create({
      data: {
        id: orderId, customerId: guest.id, customerName: "Guest", phone: guest.phone ?? "0300-0000000", email,
        subtotal: 599, total: 599, orderType: "pickup",
        items: { create: [{ itemNameSnapshot: "Ba Zinga", unitPrice: 599, quantity: 1, subtotal: 599 }] },
      },
    });

    // no account yet -> nothing happens
    expect(await linkLegacyRecords({ email, apply: true })).toMatchObject({ accountFound: false });

    const account = await registerCustomer(app, { email, name: "Real Owner" });
    const dry = await linkLegacyRecords({ email, apply: false });
    expect(dry).toMatchObject({ accountFound: true, orders: 1, applied: false });
    expect((await account.agent.get("/api/customer/orders")).body.data).toHaveLength(0); // dry run changed nothing

    await linkLegacyRecords({ email, apply: true });
    const list = await account.agent.get("/api/customer/orders");
    expect(list.body.data.map((o: { id: string }) => o.id)).toEqual([orderId]);
  });

  it("never steals records that already belong to another registered account", async () => {
    const owner = await registerCustomer(app, { name: "Owner" });
    const order = await owner.agent.post("/api/orders").send(orderBody());
    const other = await registerCustomer(app, { name: "Other" });
    // 'Other' pretends to own Owner's email: there is nothing legacy to link.
    const result = await linkLegacyRecords({ email: other.email, apply: true });
    expect(result).toMatchObject({ accountFound: true, orders: 0 });
    expect((await other.agent.get(`/api/customer/orders/${order.body.data.id}`)).status).toBe(404);
  });
});

describe("account holders in the admin dashboard", () => {
  it("shows new orders and reservations to admin, and the customer with their order phone", async () => {
    const c = await registerCustomer(app, { name: "Dash Visible" });
    const phone = uniquePhone();
    const order = await c.agent.post("/api/orders").send(orderBody({ phone }));
    const reservation = await c.agent.post("/api/reservations").send(reservationBody({ phone }));
    const cookie = await adminCookieHeader();

    const orders = await request(app).get("/api/admin/orders").query({ search: order.body.data.id }).set("Cookie", cookie);
    expect(orders.body.data.items.map((o: { id: string }) => o.id)).toContain(order.body.data.id);
    const reservations = await request(app).get("/api/admin/reservations").query({ search: phone }).set("Cookie", cookie);
    expect(reservations.body.data.items.map((r: { id: string }) => r.id)).toContain(reservation.body.data.id);

    const customers = await request(app).get("/api/admin/customers").query({ search: c.email }).set("Cookie", cookie);
    const found = customers.body.data.items.find((x: { email?: string }) => x.email === c.email);
    expect(found).toMatchObject({ name: "Dash Visible", phone, totalOrders: 1, reservationCount: 1 });
    expect(JSON.stringify(customers.body)).not.toMatch(/passwordHash|sessionVersion|loginEmail/);
  });
});
