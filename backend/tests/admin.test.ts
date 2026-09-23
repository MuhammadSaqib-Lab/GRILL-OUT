import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";

const app = createApp();

// Every hit of /auth/login — success or failure — counts against
// adminLoginRateLimiter, which is a single shared instance for the whole
// app/process. Tracking the count here lets the lockout test at the bottom
// compute exactly how many more requests are needed to trip it, instead of
// hardcoding a number that would drift out of sync with the rest of this file.
let loginAttempts = 0;
function postLogin(agent: request.Agent | ReturnType<typeof request>, body: Record<string, unknown>) {
  loginAttempts++;
  return agent.post("/api/admin/auth/login").send(body);
}

function uniquePhone() {
  return `03${Math.floor(100000000 + Math.random() * 899999999)}`;
}

async function createPublicOrder(overrides: Partial<{ customerName: string; phone: string }> = {}) {
  return request(app)
    .post("/api/orders")
    .send({
      customerName: overrides.customerName ?? "Admin Test Customer",
      phone: overrides.phone ?? uniquePhone(),
      items: [{ menuItemId: 21, quantity: 1 }], // Ba Zinga, Rs. 599 flat
      orderType: "pickup",
    });
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function createPublicReservation(overrides: Partial<{ customerName: string; phone: string }> = {}) {
  return request(app)
    .post("/api/reservations")
    .send({
      customerName: overrides.customerName ?? "Admin Test Diner",
      phone: overrides.phone ?? uniquePhone(),
      date: tomorrow(),
      time: "19:30",
      guests: "3-4",
    });
}

describe("admin auth", () => {
  it("rejects an email that has no admin account", async () => {
    const res = await postLogin(request(app), { email: "nobody@grillout.local", password: "whatever123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("rejects the right email with the wrong password", async () => {
    const res = await postLogin(request(app), { email: env.ADMIN_EMAIL, password: "definitely-wrong" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("rejects a malformed login body before ever checking credentials", async () => {
    const res = await postLogin(request(app), { email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("never leaks a password hash in the login or profile response", async () => {
    const agent = request.agent(app);
    const login = await postLogin(agent, { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });

    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"]).toBeDefined();
    expect(login.body.data.email).toBe(env.ADMIN_EMAIL);
    expect(login.body.data.passwordHash).toBeUndefined();

    const me = await agent.get("/api/admin/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(env.ADMIN_EMAIL);
    expect(me.body.data.passwordHash).toBeUndefined();
  });

  it("rejects every admin route when no session cookie is sent", async () => {
    const dashboard = await request(app).get("/api/admin/dashboard");
    expect(dashboard.status).toBe(401);

    const orders = await request(app).get("/api/admin/orders");
    expect(orders.status).toBe(401);

    const menu = await request(app).get("/api/admin/menu/items");
    expect(menu.status).toBe(401);
  });

  it("invalidates the session on logout", async () => {
    const agent = request.agent(app);
    await postLogin(agent, { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });

    const before = await agent.get("/api/admin/auth/me");
    expect(before.status).toBe(200);

    const logout = await agent.post("/api/admin/auth/logout");
    expect(logout.status).toBe(200);

    const after = await agent.get("/api/admin/auth/me");
    expect(after.status).toBe(401);
  });
});

describe("authenticated admin API", () => {
  const adminAgent = request.agent(app);

  beforeAll(async () => {
    const res = await postLogin(adminAgent, { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
    expect(res.status).toBe(200);
  });

  describe("GET /api/admin/dashboard", () => {
    it("returns real stats that move when a new order is placed", async () => {
      const before = await adminAgent.get("/api/admin/dashboard");
      expect(before.status).toBe(200);
      const beforeTotal = before.body.data.stats.totalOrders;

      const order = await createPublicOrder();
      expect(order.status).toBe(201);

      const after = await adminAgent.get("/api/admin/dashboard");
      expect(after.status).toBe(200);
      expect(after.body.data.stats.totalOrders).toBeGreaterThanOrEqual(beforeTotal + 1);
      expect(after.body.data.stats.ordersByStatus.PENDING).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(after.body.data.popularItems)).toBe(true);
      // Every status key must be present even at zero — the UI renders all of them.
      expect(Object.keys(after.body.data.stats.ordersByStatus).sort()).toEqual(
        ["CANCELLED", "COMPLETED", "CONFIRMED", "OUT_FOR_DELIVERY", "PENDING", "PREPARING", "READY"].sort()
      );
    });
  });

  describe("admin orders", () => {
    it("lists orders with pagination metadata", async () => {
      const res = await adminAgent.get("/api/admin/orders?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data).toHaveProperty("totalPages");
      expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    });

    it("finds an order by searching its customer name", async () => {
      const name = `Searchable Diner ${Date.now()}`;
      const created = await createPublicOrder({ customerName: name });
      expect(created.status).toBe(201);

      const res = await adminAgent.get(`/api/admin/orders?search=${encodeURIComponent(name)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((o: { id: string }) => o.id === created.body.data.id)).toBe(true);
    });

    it("fetches a single order with full snapshot line items", async () => {
      const created = await createPublicOrder();
      const res = await adminAgent.get(`/api/admin/orders/${created.body.data.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items[0].name).toBe("Ba Zinga");
    });

    it("walks an order through its status lifecycle", async () => {
      const created = await createPublicOrder();
      const id = created.body.data.id;

      const toConfirmed = await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status: "CONFIRMED" });
      expect(toConfirmed.status).toBe(200);
      expect(toConfirmed.body.data.status).toBe("CONFIRMED");

      const toPreparing = await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status: "PREPARING" });
      expect(toPreparing.status).toBe(200);
      expect(toPreparing.body.data.status).toBe("PREPARING");
    });

    it("rejects a status value the schema doesn't recognize", async () => {
      const created = await createPublicOrder();
      const res = await adminAgent
        .patch(`/api/admin/orders/${created.body.data.id}/status`)
        .send({ status: "ON_FIRE" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("refuses to move a cancelled order to any other status", async () => {
      const created = await createPublicOrder();
      const id = created.body.data.id;
      await request(app).post(`/api/orders/${id}/cancel`);

      const res = await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status: "CONFIRMED" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });
  });

  describe("admin reservations", () => {
    it("lists reservations with pagination metadata", async () => {
      const res = await adminAgent.get("/api/admin/reservations?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("totalPages");
    });

    it("walks a reservation from pending to confirmed to completed", async () => {
      const created = await createPublicReservation();
      expect(created.status).toBe(201);
      const id = created.body.data.id;

      const toConfirmed = await adminAgent
        .patch(`/api/admin/reservations/${id}/status`)
        .send({ status: "CONFIRMED" });
      expect(toConfirmed.status).toBe(200);
      expect(toConfirmed.body.data.status).toBe("CONFIRMED");

      const toCompleted = await adminAgent
        .patch(`/api/admin/reservations/${id}/status`)
        .send({ status: "COMPLETED" });
      expect(toCompleted.status).toBe(200);
      expect(toCompleted.body.data.status).toBe("COMPLETED");

      const reopen = await adminAgent.patch(`/api/admin/reservations/${id}/status`).send({ status: "CANCELLED" });
      expect(reopen.status).toBe(409);
    });

    it("rejects an unrecognized status value", async () => {
      const created = await createPublicReservation();
      const res = await adminAgent
        .patch(`/api/admin/reservations/${created.body.data.id}/status`)
        .send({ status: "MAYBE" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("filters reservations to just today's date", async () => {
      const created = await createPublicReservation();
      const res = await adminAgent.get("/api/admin/reservations?when=today");
      expect(res.status).toBe(200);
      // Our fixture is booked for tomorrow, so it must NOT show up in "today".
      expect(res.body.data.items.some((r: { id: string }) => r.id === created.body.data.id)).toBe(false);
    });
  });

  describe("admin customers", () => {
    it("surfaces a customer with computed order stats after they order", async () => {
      const phone = uniquePhone();
      const name = `Customer Stats Test ${Date.now()}`;
      const order = await createPublicOrder({ customerName: name, phone });
      expect(order.status).toBe(201);

      const res = await adminAgent.get(`/api/admin/customers?search=${encodeURIComponent(phone)}`);
      expect(res.status).toBe(200);
      const found = res.body.data.items.find((c: { phone: string }) => c.phone === phone);
      expect(found).toBeDefined();
      expect(found.totalOrders).toBeGreaterThanOrEqual(1);
      expect(found.totalSpent).toBeGreaterThanOrEqual(599);
    });
  });

  describe("admin menu management", () => {
    let categoryId: number;
    let itemId: number;

    it("creates a category", async () => {
      const res = await adminAgent.post("/api/admin/menu/categories").send({
        slug: `admin-test-cat-${Date.now()}`,
        name: `Admin Test Category ${Date.now()}`,
        sortOrder: 999,
      });
      expect(res.status).toBe(201);
      categoryId = res.body.data.id;
    });

    it("creates a menu item with size options under that category", async () => {
      const res = await adminAgent.post("/api/admin/menu/items").send({
        categoryId,
        name: `Admin Test Item ${Date.now()}`,
        description: "A temporary item created by the admin test suite.",
        price: 500,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        options: [
          { label: "Small", price: 500 },
          { label: "Large", price: 800 },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.data.options).toHaveLength(2);
      itemId = res.body.data.id;
    });

    it("rejects an update with no fields at all", async () => {
      const res = await adminAgent.patch(`/api/admin/menu/items/${itemId}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("toggles the item's availability", async () => {
      const res = await adminAgent.patch(`/api/admin/menu/items/${itemId}`).send({ isAvailable: false });
      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
    });

    it("hard-deletes the item since no order has ever referenced it", async () => {
      const res = await adminAgent.delete(`/api/admin/menu/items/${itemId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe("deleted");
    });

    it("deletes the now-empty category", async () => {
      const res = await adminAgent.delete(`/api/admin/menu/categories/${categoryId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe("deleted");
    });

    it("deactivates instead of deleting a menu item referenced by a real order", async () => {
      const order = await createPublicOrder(); // references menu item 21 (Ba Zinga)
      expect(order.status).toBe(201);

      const res = await adminAgent.delete("/api/admin/menu/items/21");
      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe("deactivated");

      // Restore it — item 21 is shared seed data other tests in this suite rely on.
      await prisma.menuItem.update({ where: { id: 21 }, data: { isAvailable: true } });
    });

    it("deactivates instead of deleting a category that still has items", async () => {
      const stillHasItems = await prisma.menuCategory.findFirst({ where: { items: { some: {} } } });
      if (!stillHasItems) throw new Error("Expected at least one seeded category with items");

      const res = await adminAgent.delete(`/api/admin/menu/categories/${stillHasItems.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe("deactivated");

      // Restore it — this is real seeded category data.
      await prisma.menuCategory.update({ where: { id: stillHasItems.id }, data: { isActive: true } });
    });
  });
});

describe("admin login rate limiting", () => {
  // This must run last: it deliberately exhausts adminLoginRateLimiter's
  // quota for the rest of this process, which would break any login
  // attempted afterwards in this file.
  it("locks out further attempts once the configured limit is hit", async () => {
    const remaining = env.ADMIN_LOGIN_RATE_LIMIT_MAX - loginAttempts;
    for (let i = 0; i < remaining; i++) {
      const res = await postLogin(request(app), { email: env.ADMIN_EMAIL, password: "still-wrong" });
      expect(res.status).toBe(400);
    }

    const blocked = await postLogin(request(app), { email: env.ADMIN_EMAIL, password: "still-wrong" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
