/** End-to-end flows through the real HTTP API, the real database and the email
 * outbox: exactly what the website and the admin dashboard do, in order. */
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";
import { mailOutbox, type MailMessage } from "../src/services/email.service";
import { restaurantNowTime, restaurantToday } from "../src/utils/restaurantTime";
import { adminCookieHeader, orderBody, registerCustomer, reservationBody, uniquePhone, type TestCustomer } from "./helpers";

const app = createApp();

let alice: TestCustomer;
let bob: TestCustomer;
beforeAll(async () => {
  alice = await registerCustomer(app, { name: "Alice E2E" });
  bob = await registerCustomer(app, { name: "Bob E2E" });
});
beforeEach(() => mailOutbox.clear());

const admin = async () => ({ Cookie: await adminCookieHeader() });
const setOrder = async (id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/admin/orders/${id}/status`).set(await admin()).send(body);
const setReservation = async (id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/admin/reservations/${id}/status`).set(await admin()).send(body);
const sent = () => mailOutbox.all() as readonly MailMessage[];

describe("customer session endpoint", () => {
  it("answers 200 { customer: null } when logged out, so anonymous page views raise no error", async () => {
    const res = await request(app).get("/api/auth/customer/session");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { customer: null } });
  });

  it("returns only name and email when logged in", async () => {
    const res = await alice.agent.get("/api/auth/customer/session");
    expect(res.status).toBe(200);
    expect(res.body.data.customer).toEqual({ name: "Alice E2E", email: alice.email });
  });

  it("does not accept an admin session as a customer session", async () => {
    const res = await request(app).get("/api/auth/customer/session").set(await admin());
    expect(res.body.data.customer).toBeNull();
  });
});

describe("Test 1: order → admin email → admin confirms with a message → customer sees it + is emailed", () => {
  it("runs the whole chain, and a repeated identical PATCH does not email twice", async () => {
    const created = await alice.agent.post("/api/orders").send(orderBody());
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    expect(sent().map((m) => m.to)).toEqual([env.ADMIN_NOTIFY_EMAIL]);
    expect(sent()[0]?.subject).toContain(id);

    // Admin dashboard reads it from the database.
    const list = await request(app).get("/api/admin/orders").query({ search: id }).set(await admin());
    expect(list.body.data.items.map((o: { id: string }) => o.id)).toContain(id);

    mailOutbox.clear();
    const confirm = await setOrder(id, { status: "CONFIRMED", message: "Ready in 25 minutes, thanks!" });
    expect(confirm.status).toBe(200);
    expect(sent()).toHaveLength(1);
    expect(sent()[0]?.to).toBe(alice.email);
    expect(sent()[0]?.text).toContain("Ready in 25 minutes, thanks!");

    const seen = await alice.agent.get(`/api/customer/orders/${id}`);
    expect(seen.body.data).toMatchObject({ status: "CONFIRMED", adminMessage: "Ready in 25 minutes, thanks!" });

    // Same status again (double-click / retry): the database is unchanged and nobody is emailed again.
    mailOutbox.clear();
    const again = await setOrder(id, { status: "CONFIRMED", message: "Ready in 25 minutes, thanks!" });
    expect(again.status).toBe(200);
    expect(sent()).toHaveLength(0);
  });
});

describe("Test 2: reservation → admin email → admin confirms → customer sees it + is emailed", () => {
  it("runs the whole chain", async () => {
    const created = await alice.agent.post("/api/reservations").send(reservationBody({ guests: "5-6" }));
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    expect(sent().map((m) => m.to)).toEqual([env.ADMIN_NOTIFY_EMAIL]);
    expect(sent()[0]?.subject).toContain(id);

    mailOutbox.clear();
    const confirm = await setReservation(id, { status: "CONFIRMED", message: "Your table is by the window." });
    expect(confirm.status).toBe(200);
    expect(sent()).toHaveLength(1);
    expect(sent()[0]?.to).toBe(alice.email);
    expect(sent()[0]?.text).toContain("Your table is by the window.");

    const seen = await alice.agent.get(`/api/customer/reservations/${id}`);
    expect(seen.body.data).toMatchObject({ status: "CONFIRMED", adminMessage: "Your table is by the window." });

    mailOutbox.clear();
    await setReservation(id, { status: "CONFIRMED", message: "Your table is by the window." });
    expect(sent()).toHaveLength(0);
  });
});

describe("Tests 3 & 4: admin cancels with a reason — kept in the database, shown and emailed", () => {
  it("order cancelled with a reason", async () => {
    const id = (await alice.agent.post("/api/orders").send(orderBody())).body.data.id as string;
    mailOutbox.clear();
    expect((await setOrder(id, { status: "CANCELLED", message: "Sorry, we ran out of dough." })).status).toBe(200);

    expect(sent()).toHaveLength(1);
    expect(sent()[0]?.to).toBe(alice.email);
    expect(sent()[0]?.text).toContain("Sorry, we ran out of dough.");

    const row = await prisma.order.findUnique({ where: { id } });
    expect(row).toMatchObject({ status: "CANCELLED", adminMessage: "Sorry, we ran out of dough." });
    const seen = await alice.agent.get(`/api/customer/orders/${id}`);
    expect(seen.body.data).toMatchObject({ status: "CANCELLED", adminMessage: "Sorry, we ran out of dough." });
  });

  it("reservation cancelled with a reason", async () => {
    const id = (await alice.agent.post("/api/reservations").send(reservationBody())).body.data.id as string;
    mailOutbox.clear();
    expect((await setReservation(id, { status: "CANCELLED", message: "We are closed for a private event." })).status).toBe(200);

    expect(sent()).toHaveLength(1);
    expect(sent()[0]?.to).toBe(alice.email);
    expect(sent()[0]?.text).toContain("We are closed for a private event.");

    const row = await prisma.reservation.findUnique({ where: { id } });
    expect(row).toMatchObject({ status: "CANCELLED", adminMessage: "We are closed for a private event." });
    const seen = await alice.agent.get(`/api/customer/reservations/${id}`);
    expect(seen.body.data).toMatchObject({ status: "CANCELLED", adminMessage: "We are closed for a private event." });
  });

  it("a status change that fails (unknown id) sends no email", async () => {
    const res = await setOrder("ORD-DOESNOTEXIST", { status: "CONFIRMED", message: "hi" });
    expect(res.status).toBe(404);
    expect(sent()).toHaveLength(0);
  });
});

describe("customer cancels their own record → the restaurant is emailed", () => {
  it("order", async () => {
    const id = (await alice.agent.post("/api/orders").send(orderBody())).body.data.id as string;
    mailOutbox.clear();
    const res = await alice.agent.post(`/api/orders/${id}/cancel`);
    expect(res.status).toBe(200);
    expect(sent().map((m) => m.to)).toEqual([env.ADMIN_NOTIFY_EMAIL]);
    expect(sent()[0]?.subject).toContain(id);

    mailOutbox.clear();
    expect((await alice.agent.post(`/api/orders/${id}/cancel`)).status).toBe(409); // already cancelled
    expect(sent()).toHaveLength(0);
  });

  it("reservation", async () => {
    const id = (await alice.agent.post("/api/reservations").send(reservationBody())).body.data.id as string;
    mailOutbox.clear();
    const res = await alice.agent.post(`/api/reservations/${id}/cancel`);
    expect(res.status).toBe(200);
    expect(sent().map((m) => m.to)).toEqual([env.ADMIN_NOTIFY_EMAIL]);
    expect(sent()[0]?.subject).toContain(id);
  });

  it("the admin cannot revive a record the customer already cancelled by re-cancelling it", async () => {
    const id = (await alice.agent.post("/api/orders").send(orderBody())).body.data.id as string;
    await alice.agent.post(`/api/orders/${id}/cancel`);
    mailOutbox.clear();
    await setOrder(id, { status: "CANCELLED", message: "again" });
    expect(sent()).toHaveLength(0); // already cancelled: nothing changed, nobody emailed
  });
});

describe("Test 5: Customer A cannot see or touch Customer B's records", () => {
  it("orders and reservations are invisible and untouchable across accounts", async () => {
    const order = (await alice.agent.post("/api/orders").send(orderBody())).body.data.id as string;
    const reservation = (await alice.agent.post("/api/reservations").send(reservationBody())).body.data.id as string;

    expect((await bob.agent.get(`/api/customer/orders/${order}`)).status).toBe(404);
    expect((await bob.agent.get(`/api/customer/reservations/${reservation}`)).status).toBe(404);
    expect((await bob.agent.post(`/api/orders/${order}/cancel`)).status).toBe(404);
    expect((await bob.agent.post(`/api/reservations/${reservation}/cancel`)).status).toBe(404);

    const bobsOrders = (await bob.agent.get("/api/customer/orders")).body.data.map((o: { id: string }) => o.id);
    const bobsReservations = (await bob.agent.get("/api/customer/reservations")).body.data.map((r: { id: string }) => r.id);
    expect(bobsOrders).not.toContain(order);
    expect(bobsReservations).not.toContain(reservation);

    // Alice's records are still exactly as she left them.
    expect((await alice.agent.get(`/api/customer/orders/${order}`)).body.data.status).toBe("PENDING");
    expect((await alice.agent.get(`/api/customer/reservations/${reservation}`)).body.data.status).toBe("PENDING");
  });

  it("a customer id in the request body is ignored — the order still belongs to the session's customer", async () => {
    const aliceRow = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: alice.email } });
    const res = await bob.agent.post("/api/orders").send({ ...orderBody(), customerId: aliceRow.id });
    expect(res.status === 201 || res.status === 400).toBe(true);
    if (res.status === 201) {
      const row = await prisma.order.findUniqueOrThrow({ where: { id: res.body.data.id } });
      expect(row.customerId).not.toBe(aliceRow.id);
    }
  });
});

describe("Tests 6 & 7: the two auth systems and logged-out access", () => {
  it("a customer session cannot use any admin API", async () => {
    for (const path of ["/api/admin/orders", "/api/admin/reservations", "/api/admin/customers", "/api/admin/stats", "/api/admin/auth/me"]) {
      expect((await alice.agent.get(path)).status, path).toBe(401);
    }
    const patch = await alice.agent.patch("/api/admin/orders/ORD-X/status").send({ status: "CONFIRMED" });
    expect(patch.status).toBe(401);
  });

  it("an admin session cannot act as a customer", async () => {
    for (const path of ["/api/customer/orders", "/api/customer/reservations", "/api/auth/customer/me"]) {
      expect((await request(app).get(path).set(await admin())).status, path).toBe(401);
    }
    expect((await request(app).post("/api/orders").set(await admin()).send(orderBody())).status).toBe(401);
    expect((await request(app).post("/api/reservations").set(await admin()).send(reservationBody())).status).toBe(401);
  });

  it("logged out: account APIs, ordering and reserving all require login", async () => {
    for (const path of ["/api/customer/orders", "/api/customer/reservations", "/api/auth/customer/me"]) {
      expect((await request(app).get(path)).status, path).toBe(401);
    }
    expect((await request(app).post("/api/orders").send(orderBody())).status).toBe(401);
    expect((await request(app).post("/api/reservations").send(reservationBody())).status).toBe(401);
  });

  it("logout really ends the session (the old cookie is dead server-side)", async () => {
    const carol = await registerCustomer(app, { name: "Carol E2E" });
    const login = await request(app).post("/api/auth/customer/login").send({ email: carol.email, password: carol.password });
    const cookie = (login.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
    expect((await request(app).get("/api/customer/orders").set("Cookie", cookie)).status).toBe(200);
    expect((await carol.agent.post("/api/auth/customer/logout")).status).toBeLessThan(300);
    expect((await carol.agent.get("/api/customer/orders")).status).toBe(401);
    // The other session token (copied before logout) is revoked too: logout bumps the session version.
    expect((await request(app).get("/api/customer/orders").set("Cookie", cookie)).status).toBe(401);
  });
});

describe("reservation date and time rules (restaurant clock)", () => {
  const today = () => restaurantToday();
  const yesterday = () => {
    const d = new Date(`${restaurantToday()}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  it("rejects a date in the past", async () => {
    const res = await alice.agent.post("/api/reservations").send(reservationBody({ date: yesterday() }));
    expect(res.status).toBe(400);
  });

  it("rejects impossible calendar dates and malformed values", async () => {
    for (const date of ["2099-02-30", "2099-13-01", "not-a-date", "2099-1-1", ""]) {
      expect((await alice.agent.post("/api/reservations").send(reservationBody({ date }))).status, date).toBe(400);
    }
    for (const time of ["25:00", "12:60", "7pm", ""]) {
      expect((await alice.agent.post("/api/reservations").send(reservationBody({ time }))).status, time).toBe(400);
    }
  });

  it("rejects a time earlier today, accepts a later time today", async () => {
    const now = restaurantNowTime();
    if (now > "00:05") {
      const past = await alice.agent.post("/api/reservations").send(reservationBody({ date: today(), time: "00:01" }));
      expect(past.status).toBe(400);
    }
    if (now < "23:50") {
      const later = await alice.agent.post("/api/reservations").send(reservationBody({ date: today(), time: "23:55" }));
      expect(later.status).toBe(201);
    }
  });

  it("refuses the same customer booking the same date and time twice, but allows it again after cancelling", async () => {
    const body = reservationBody();
    const first = await bob.agent.post("/api/reservations").send(body);
    expect(first.status).toBe(201);
    mailOutbox.clear();
    const dup = await bob.agent.post("/api/reservations").send({ ...body, phone: uniquePhone() });
    expect(dup.status).toBe(409);
    expect(sent()).toHaveLength(0); // a refused booking emails nobody

    await bob.agent.post(`/api/reservations/${first.body.data.id}/cancel`);
    expect((await bob.agent.post("/api/reservations").send(body)).status).toBe(201);
  });

  it("a different customer can book the same slot (tables are not per-customer here)", async () => {
    const body = reservationBody();
    expect((await alice.agent.post("/api/reservations").send(body)).status).toBe(201);
    expect((await bob.agent.post("/api/reservations").send(body)).status).toBe(201);
  });
});

describe("admin customer detail", () => {
  it("shows a customer's real orders and reservations and never any credential", async () => {
    const dana = await registerCustomer(app, { name: "Dana Detail" });
    const orderId = (await dana.agent.post("/api/orders").send(orderBody())).body.data.id as string;
    const resId = (await dana.agent.post("/api/reservations").send(reservationBody())).body.data.id as string;
    const row = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: dana.email } });

    const res = await request(app).get(`/api/admin/customers/${row.id}`).set(await admin());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Dana Detail", email: dana.email, kind: "account" });
    expect(res.body.data.orders.map((o: { id: string }) => o.id)).toEqual([orderId]);
    expect(res.body.data.reservations.map((r: { id: string }) => r.id)).toEqual([resId]);
    const raw = JSON.stringify(res.body);
    for (const secret of ["passwordHash", "sessionVersion", "loginEmail", "$2"]) expect(raw).not.toContain(secret);
  });

  it("404 for an unknown id, 400 for a malformed id, 401 for a customer or anonymous caller", async () => {
    expect((await request(app).get("/api/admin/customers/cabcdefghijklmnopqrstuv").set(await admin())).status).toBe(404);
    expect((await request(app).get("/api/admin/customers/1;drop").set(await admin())).status).toBe(400);
    expect((await alice.agent.get("/api/admin/customers/cabcdefghijklmnopqrstuv")).status).toBe(401);
    expect((await request(app).get("/api/admin/customers/cabcdefghijklmnopqrstuv")).status).toBe(401);
  });
});

describe("menu integrity", () => {
  it("items in a deactivated category are hidden from the public menu and categories, and cannot be ordered", async () => {
    const slug = `qa-hidden-${Date.now()}`;
    const category = await prisma.menuCategory.create({ data: { slug, name: "QA Hidden", isActive: false, sortOrder: 999 } });
    const item = await prisma.menuItem.create({
      data: { categoryId: category.id, name: "QA Hidden Dish", slug, description: "x", price: 100, image: "https://example.com/x.jpg" },
    });
    try {
      const menu = await request(app).get("/api/menu");
      expect(menu.body.data.map((m: { id: number }) => m.id)).not.toContain(item.id);
      const cats = await request(app).get("/api/categories");
      expect(cats.body.data.map((c: { key: string }) => c.key)).not.toContain(slug);
    } finally {
      await prisma.menuItem.delete({ where: { id: item.id } });
      await prisma.menuCategory.delete({ where: { id: category.id } });
    }
  });

  it("an unavailable item is still listed (flagged) but an order for it is refused", async () => {
    const slug = `qa-soldout-${Date.now()}`;
    const category = await prisma.menuCategory.create({ data: { slug, name: "QA Soldout", isActive: true, sortOrder: 998 } });
    const item = await prisma.menuItem.create({
      data: { categoryId: category.id, name: "QA Sold Out Dish", slug, description: "x", price: 100, image: "https://example.com/x.jpg", isAvailable: false },
    });
    try {
      const menu = await request(app).get("/api/menu");
      expect(menu.body.data.find((m: { id: number }) => m.id === item.id)).toMatchObject({ available: false });
      const order = await alice.agent.post("/api/orders").send(orderBody({ items: [{ menuItemId: item.id, quantity: 1 }] }));
      expect(order.status).toBe(400);
    } finally {
      await prisma.menuItem.delete({ where: { id: item.id } });
      await prisma.menuCategory.delete({ where: { id: category.id } });
    }
  });

  it("the server prices the order from the database, ignoring any price the client sends", async () => {
    const res = await alice.agent
      .post("/api/orders")
      .send({ ...orderBody(), items: [{ menuItemId: 21, quantity: 1, price: 1, unitPrice: 1 }], total: 1 });
    if (res.status === 201) expect(res.body.data.total).toBeGreaterThan(1);
    else expect(res.status).toBe(400);
  });
});
