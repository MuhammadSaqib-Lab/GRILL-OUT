import jwt from "jsonwebtoken";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";
import { adminCookie } from "../src/utils/adminToken";
import { redact } from "../src/utils/logger";
import { hashPassword } from "../src/utils/password";
import { registerCustomer, testAdmin, type TestCustomer } from "./helpers";

const app = createApp();

function cookieFor(token: string) {
  return `${adminCookie.name}=${token}`;
}

function uniquePhone() {
  return `03${Math.floor(100000000 + Math.random() * 899999999)}`;
}

const validOrder = () => ({
  phone: uniquePhone(),
  items: [{ menuItemId: 21, quantity: 1 }],
  orderType: "pickup",
});

let customer: TestCustomer;
beforeAll(async () => {
  customer = await registerCustomer(app, { name: "Security Test" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin session tokens are verified strictly", () => {
  it("rejects a token signed with a different secret", async () => {
    const forged = jwt.sign({ sub: "x", email: "someone@grillout.test", ver: 0 }, "a-completely-different-secret-value-0000", {
      algorithm: "HS256",
    });
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(forged));
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: (await testAdmin()).id } });
    const expired = jwt.sign({ sub: admin.id, email: admin.email, ver: admin.sessionVersion }, env.ADMIN_JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: -60,
    });
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(expired));
    expect(res.status).toBe(401);
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: (await testAdmin()).id } });
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const none = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: admin.id, email: admin.email, ver: admin.sessionVersion })}.`;
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(none));
    expect(res.status).toBe(401);
  });

  it("rejects a correctly signed token whose payload has the wrong shape", async () => {
    const odd = jwt.sign({ role: "admin" }, env.ADMIN_JWT_SECRET, { algorithm: "HS256" });
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(odd));
    expect(res.status).toBe(401);
  });

  it("rejects a valid token once its admin account has been deleted", async () => {
    const temp = await prisma.adminUser.create({
      data: { email: `temp-${Date.now()}@grillout.local`, passwordHash: await hashPassword("temp-password-123"), name: "Temp" },
    });
    const token = jwt.sign({ sub: temp.id, email: temp.email, ver: temp.sessionVersion }, env.ADMIN_JWT_SECRET, {
      algorithm: "HS256",
    });

    const before = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(token));
    expect(before.status).toBe(200);

    await prisma.adminUser.delete({ where: { id: temp.id } });

    const after = await request(app).get("/api/admin/dashboard").set("Cookie", cookieFor(token));
    expect(after.status).toBe(401);
  });

  it("revokes the old token server-side on logout (not just the browser cookie)", async () => {
    const admin = await prisma.adminUser.create({
      data: { email: `logout-${Date.now()}@grillout.local`, passwordHash: await hashPassword("temp-password-123"), name: "Temp" },
    });
    try {
      const login = await request(app)
        .post("/api/admin/auth/login")
        .send({ email: admin.email, password: "temp-password-123" });
      expect(login.status).toBe(200);
      const setCookie = (login.headers["set-cookie"] as unknown as string[])[0] as string;
      const token = /=([^;]+)/.exec(setCookie)?.[1] as string;

      const ok = await request(app).get("/api/admin/auth/me").set("Cookie", cookieFor(token));
      expect(ok.status).toBe(200);

      await request(app).post("/api/admin/auth/logout").set("Cookie", cookieFor(token));

      // The attacker/stolen-copy case: same token, replayed after logout.
      const replay = await request(app).get("/api/admin/auth/me").set("Cookie", cookieFor(token));
      expect(replay.status).toBe(401);
    } finally {
      await prisma.adminUser.delete({ where: { id: admin.id } });
    }
  });

  it("sets a hardened session cookie", async () => {
    const admin = await prisma.adminUser.create({
      data: { email: `cookie-${Date.now()}@grillout.local`, passwordHash: await hashPassword("temp-password-123"), name: "Temp" },
    });
    try {
      const login = await request(app)
        .post("/api/admin/auth/login")
        .send({ email: admin.email, password: "temp-password-123" });
      const cookie = (login.headers["set-cookie"] as unknown as string[])[0] as string;
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).toMatch(/Max-Age=/i);
      expect(cookie).toMatch(/Path=\//i);
    } finally {
      await prisma.adminUser.delete({ where: { id: admin.id } });
    }
  });
});

describe("order tampering is rejected server-side", () => {
  const post = (body: unknown) => customer.agent.post("/api/orders").send(body as object);

  it("ignores a client-sent price, subtotal, total and delivery fee", async () => {
    const res = await post({ ...validOrder(), items: [{ menuItemId: 21, quantity: 2, price: 1, unitPrice: 1 }], subtotal: 1, total: 1, deliveryFee: 0 });
    expect(res.status).toBe(201);
    expect(res.body.data.items[0].unitPrice).toBe(599);
    expect(res.body.data.subtotal).toBe(1198);
    expect(res.body.data.total).toBe(1198);
  });

  it("charges the real delivery fee no matter what the client claims", async () => {
    const res = await post({
      ...validOrder(),
      orderType: "delivery",
      deliveryAddress: "House 1, GT Road, Haripur",
      deliveryFee: 0,
      total: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.deliveryFee).toBe(env.DELIVERY_FEE);
    expect(res.body.data.total).toBe(599 + env.DELIVERY_FEE);
  });

  it.each([
    ["zero quantity", { menuItemId: 21, quantity: 0 }],
    ["negative quantity", { menuItemId: 21, quantity: -5 }],
    ["fractional quantity", { menuItemId: 21, quantity: 1.5 }],
    ["huge quantity", { menuItemId: 21, quantity: 1_000_000 }],
    ["string quantity", { menuItemId: 21, quantity: "5" }],
    ["negative menu id", { menuItemId: -1, quantity: 1 }],
    ["menu id beyond int4", { menuItemId: 99_999_999_999, quantity: 1 }],
    ["missing menu id", { quantity: 1 }],
  ])("rejects %s with a 400 (never a 500)", async (_label, line) => {
    const res = await post({ ...validOrder(), items: [line] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects an empty cart and an oversized cart", async () => {
    expect((await post({ ...validOrder(), items: [] })).status).toBe(400);
    const many = Array.from({ length: 51 }, () => ({ menuItemId: 21, quantity: 1 }));
    expect((await post({ ...validOrder(), items: many })).status).toBe(400);
  });

  it("rejects an item that has been made unavailable", async () => {
    await prisma.menuItem.update({ where: { id: 22 }, data: { isAvailable: false } });
    try {
      const res = await post({ ...validOrder(), items: [{ menuItemId: 22, quantity: 1 }] });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/unavailable/i);
    } finally {
      await prisma.menuItem.update({ where: { id: 22 }, data: { isAvailable: true } });
    }
  });

  it("rejects markup in customer-supplied text", async () => {
    const res = await post({ ...validOrder(), orderType: "delivery", deliveryAddress: '<img src=x onerror=alert(1)>' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.deliveryAddress).toBeDefined();

    const res2 = await post({ ...validOrder(), specialInstructions: "<script>alert(1)</script>" });
    expect(res2.status).toBe(400);
  });

  it("does not mass-assign unknown fields (status, id, createdAt)", async () => {
    const res = await post({ ...validOrder(), status: "COMPLETED", id: "ORD-HACKED000000", createdAt: "2000-01-01T00:00:00Z" });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.id).not.toBe("ORD-HACKED000000");
    expect(new Date(res.body.data.createdAt).getFullYear()).toBeGreaterThan(2020);
  });

  it("rejects an unknown or unexpected option label without touching the database", async () => {
    // Scoped to this customer: other test files create orders concurrently.
    const mine = () => prisma.order.count({ where: { customer: { loginEmail: customer.email } } });
    const before = await mine();
    const res = await post({ ...validOrder(), items: [{ menuItemId: 1, optionLabel: "XXL", quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(await mine()).toBe(before);
  });
});

describe("there is no public lookup of orders or reservations", () => {
  it("has no unauthenticated GET by id (that would be an id-guessing hole)", async () => {
    const created = await customer.agent.post("/api/orders").send(validOrder());
    expect(created.status).toBe(201);
    const anon = await request(app).get(`/api/orders/${created.body.data.id}`);
    expect(anon.status).toBe(404);
    const anonRes = await request(app).get("/api/reservations/RES-AAAAAAAAAAAA");
    expect(anonRes.status).toBe(404);
  });

  it("rejects malformed ids on the authenticated route before they reach the database", async () => {
    for (const id of ["1", "ORD-", "ORD-lowercase123", "..%2Fetc%2Fpasswd", "ORD-AAAAAAAA'%20OR%201=1--"]) {
      const res = await customer.agent.get(`/api/customer/orders/${id}`);
      expect(res.status, id).toBe(400);
    }
  });
});

describe("admin input hardening", () => {
  async function loggedInAgent() {
    const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: (await testAdmin()).id } });
    const token = jwt.sign({ sub: admin.id, email: admin.email, ver: admin.sessionVersion }, env.ADMIN_JWT_SECRET, {
      algorithm: "HS256",
    });
    return { cookie: cookieFor(token) };
  }

  it("rejects non-numeric and out-of-range ids with 400", async () => {
    const { cookie } = await loggedInAgent();
    for (const id of ["abc", "-1", "0", "99999999999", "1.5", "1e3"]) {
      const res = await request(app).delete(`/api/admin/menu/items/${id}`).set("Cookie", cookie);
      expect(res.status, `id=${id}`).toBe(400);
    }
  });

  it("rejects absurd pagination instead of erroring", async () => {
    const { cookie } = await loggedInAgent();
    expect((await request(app).get("/api/admin/orders?page=1000000000").set("Cookie", cookie)).status).toBe(400);
    expect((await request(app).get("/api/admin/orders?limit=100000").set("Cookie", cookie)).status).toBe(400);
    expect((await request(app).get("/api/admin/orders?page=-1").set("Cookie", cookie)).status).toBe(400);
  });

  it("treats SQL metacharacters in search as plain text", async () => {
    const { cookie } = await loggedInAgent();
    const res = await request(app)
      .get("/api/admin/orders")
      .query({ search: "'; DROP TABLE orders; --" })
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(await prisma.order.count()).toBeGreaterThan(0);
  });

  it("only accepts http(s) image URLs for menu items", async () => {
    const { cookie } = await loggedInAgent();
    const res = await request(app)
      .post("/api/admin/menu/items")
      .set("Cookie", cookie)
      .send({ categoryId: 1, name: "Bad", description: "x", price: 10, image: "javascript:alert(1)" });
    expect(res.status).toBe(400);
  });

  it("rejects absurd prices", async () => {
    const { cookie } = await loggedInAgent();
    const res = await request(app)
      .patch("/api/admin/menu/items/21")
      .set("Cookie", cookie)
      .send({ price: 1e12 });
    expect(res.status).toBe(400);
  });
});

describe("CORS", () => {
  it("allows a configured frontend origin", async () => {
    const res = await request(app).get("/api/menu").set("Origin", env.allowedOrigins[0] as string);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(env.allowedOrigins[0]);
  });

  it("refuses an unknown origin, and never answers with a wildcard", async () => {
    const res = await request(app).get("/api/menu").set("Origin", "https://evil.example");
    expect(res.status).toBe(403);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("refuses an unknown origin on the admin API too, including preflight", async () => {
    const res = await request(app)
      .options("/api/admin/orders")
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "GET");
    expect(res.status).toBe(403);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("response headers", () => {
  it("sends security headers on API responses and no framework banner", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.headers["permissions-policy"]).toMatch(/camera=\(\)/);
    expect(res.headers["x-robots-tag"]).toMatch(/noindex/);
    expect(res.headers["content-security-policy"]).toMatch(/default-src 'self'/);
  });

  it("never caches admin or order responses", async () => {
    const admin = await request(app).get("/api/admin/dashboard");
    expect(admin.headers["cache-control"]).toBe("no-store");

    const order = await request(app).get("/api/orders/ORD-AAAAAAAAAAAA");
    expect(order.headers["cache-control"]).toBe("no-store");
  });

  it("serves the admin UI with noindex and a CSP that forbids inline scripts", async () => {
    const res = await request(app).get("/admin/login.html");
    expect(res.status).toBe(200);
    expect(res.headers["x-robots-tag"]).toMatch(/noindex/);
    expect(res.headers["cache-control"]).toBe("no-store");
    const csp = res.headers["content-security-policy"] as string;
    const scriptSrc = /script-src ([^;]+)/.exec(csp)?.[1] ?? "";
    expect(scriptSrc).not.toMatch(/unsafe-inline|unsafe-eval|https:/);
    expect(csp).toMatch(/script-src-attr 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(res.text).toMatch(/<meta name="robots" content="noindex/);
  });

  it("exposes no environment or uptime on the health endpoint", async () => {
    const res = await request(app).get("/api/health");
    expect(Object.keys(res.body.data).sort()).toEqual(["database", "status", "timestamp"]);
  });
});

describe("error responses never leak internals", () => {
  it("maps a database outage to a generic 503 with no connection details", async () => {
    vi.spyOn(prisma.menuItem, "findMany").mockRejectedValue(
      new Prisma.PrismaClientInitializationError(
        "Can't reach database server at `secret-db-host.internal:5432` using password hunter2",
        "5.22.0"
      )
    );
    const res = await request(app).get("/api/menu");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toMatch(/secret-db-host|hunter2|5432/);
  });

  it("returns a bare 500 for an unexpected exception — no stack, message, or paths", async () => {
    vi.spyOn(prisma.menuItem, "findMany").mockRejectedValue(
      new Error("boom at C:\\Users\\Admin\\Desktop\\grill out\\backend\\src\\secret.ts DATABASE_URL=postgres://u:p@h/db")
    );
    const res = await request(app).get("/api/menu");
    expect(res.status).toBe(500);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/boom|secret\.ts|postgres:\/\/|Users|stack|\.ts:\d+/);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });

  it("does not echo the requested URL back on a 404", async () => {
    const res = await request(app).get("/api/<script>alert(1)</script>");
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toMatch(/script/);
  });

  it("handles a Prisma unique-constraint error as a 409 without naming columns", async () => {
    vi.spyOn(prisma.menuItem, "findMany").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`slug`)", {
        code: "P2002",
        clientVersion: "5.22.0",
        meta: { target: ["slug"] },
      })
    );
    const res = await request(app).get("/api/menu");
    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).not.toMatch(/slug/);
  });
});

describe("log redaction", () => {
  it("scrubs connection strings and credentials from log text", () => {
    const out = redact('boom DATABASE_URL=postgres://user:hunter2@db.internal:5432/app password=hunter2 token: abc123 {"apiKey":"k-999"}');
    expect(out).not.toMatch(/hunter2|abc123|k-999|user:/);
    expect(out).toContain("postgres://***@db.internal");
  });

  it("does not disturb ordinary log lines", () => {
    expect(redact("Validation error /api/orders customerName too short")).toBe("Validation error /api/orders customerName too short");
  });
});

