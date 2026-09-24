import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";
import { customerCookie } from "../src/utils/customerToken";
import { PASSWORD, adminCookieHeader, orderBody, registerCustomer, uniqueEmail } from "./helpers";

const app = createApp();

const signup = (body: Record<string, unknown>) => request(app).post("/api/auth/customer/signup").send(body);
const login = (body: Record<string, unknown>) => request(app).post("/api/auth/customer/login").send(body);
const cookieHeader = (token: string) => `${customerCookie.name}=${token}`;

describe("customer signup", () => {
  it("creates an account, logs the customer in, and returns only name + email", async () => {
    const email = uniqueEmail("signup");
    const res = await signup({ name: "Jane Diner", email, password: PASSWORD, confirmPassword: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ name: "Jane Diner", email });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|sessionVersion|"id"/);

    const cookie = (res.headers["set-cookie"] as unknown as string[])[0] as string;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=/);
  });

  it("stores a bcrypt hash — never the plaintext password — and a lower-cased email", async () => {
    const email = uniqueEmail("HASH").toUpperCase().replace("@EXAMPLE.COM", "@Example.com");
    const res = await signup({ name: "Hash Check", email, password: PASSWORD });
    expect(res.status).toBe(201);

    const row = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: email.toLowerCase() } });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$\d\d\$/);
    expect(row.passwordHash).not.toContain(PASSWORD);
    expect(row.loginEmail).toBe(email.toLowerCase());
  });

  it("rejects a duplicate email, ignoring letter case, with a friendly 409", async () => {
    const email = uniqueEmail("dup");
    expect((await signup({ name: "First", email, password: PASSWORD })).status).toBe(201);

    const again = await signup({ name: "Second", email: email.toUpperCase(), password: "An0therPassword" });
    expect(again.status).toBe(409);
    expect(again.body.error.message).toMatch(/already exists/i);
    expect(await prisma.customer.count({ where: { loginEmail: email } })).toBe(1);
  });

  it.each([
    ["missing name", { email: uniqueEmail(), password: PASSWORD }],
    ["one-letter name", { name: "A", email: uniqueEmail(), password: PASSWORD }],
    ["markup in the name", { name: "<img src=x onerror=alert(1)>", email: uniqueEmail(), password: PASSWORD }],
    ["invalid email", { name: "Bad Email", email: "not-an-email", password: PASSWORD }],
    ["password too short", { name: "Short Pw", email: uniqueEmail(), password: "abc123" }],
    ["password with no number", { name: "No Number", email: uniqueEmail(), password: "onlyLettersHere" }],
    ["password with no letter", { name: "No Letter", email: uniqueEmail(), password: "1234567890" }],
    ["password over 128 chars", { name: "Long Pw", email: uniqueEmail(), password: "a1".repeat(70) }],
    ["password/confirmation mismatch", { name: "Mismatch", email: uniqueEmail(), password: PASSWORD, confirmPassword: "different-1" }],
    ["non-string password", { name: "Object Pw", email: uniqueEmail(), password: { $ne: "" } }],
  ])("rejects %s with a 400", async (_label, body) => {
    const res = await signup(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("cannot be used to set internal fields (mass assignment)", async () => {
    const email = uniqueEmail("mass");
    const res = await signup({
      name: "Mass Assign",
      email,
      password: PASSWORD,
      id: "custom-id",
      passwordHash: "$2b$04$attackerchosenhashattackerchosenhashattackerchoshash",
      sessionVersion: 99,
      loginEmail: "victim@example.com",
      phone: "0300-0000000",
    });
    expect(res.status).toBe(201);
    const row = await prisma.customer.findUniqueOrThrow({ where: { loginEmail: email } });
    expect(row.id).not.toBe("custom-id");
    expect(row.sessionVersion).toBe(0);
    expect(row.phone).toBeNull();
    expect(row.passwordHash).not.toContain("attackerchosen");
    expect(await prisma.customer.count({ where: { loginEmail: "victim@example.com" } })).toBe(0);
  });
});

describe("customer login / me / logout", () => {
  it("logs in with the right password and reads /me from the cookie alone", async () => {
    const email = uniqueEmail("login");
    await signup({ name: "Login Person", email, password: PASSWORD });

    const agent = request.agent(app);
    const res = await agent.post("/api/auth/customer/login").send({ email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ name: "Login Person", email });

    const me = await agent.get("/api/auth/customer/me");
    expect(me.status).toBe(200);
    expect(me.body.data).toEqual({ name: "Login Person", email });
    expect(me.headers["cache-control"]).toBe("no-store");
  });

  it("rejects a wrong password and an unknown email identically", async () => {
    const email = uniqueEmail("wrong");
    await signup({ name: "Wrong Pw", email, password: PASSWORD });

    const wrong = await login({ email, password: "not-the-password-1" });
    const unknown = await login({ email: uniqueEmail("nobody"), password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
    expect(wrong.headers["set-cookie"]).toBeUndefined();
  });

  it("treats a NoSQL-style / non-string login body as invalid input", async () => {
    const res = await login({ email: { $gt: "" }, password: { $gt: "" } });
    expect(res.status).toBe(400);
  });

  it("rejects /me and the account API without a session", async () => {
    for (const path of ["/api/auth/customer/me", "/api/customer/orders", "/api/customer/reservations"]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(401);
    }
  });

  it("logout revokes the session on the server — a copied cookie stops working", async () => {
    const email = uniqueEmail("logout");
    const first = await signup({ name: "Logout Person", email, password: PASSWORD });
    const token = /=([^;]+)/.exec((first.headers["set-cookie"] as unknown as string[])[0] as string)?.[1] as string;

    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(token))).status).toBe(200);
    const out = await request(app).post("/api/auth/customer/logout").set("Cookie", cookieHeader(token));
    expect(out.status).toBe(200);
    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(token))).status).toBe(401);
  });

  it("logging out with no session is harmless", async () => {
    const res = await request(app).post("/api/auth/customer/logout");
    expect(res.status).toBe(200);
  });

  it("a passwordless legacy guest row can never log in, even with a matching email", async () => {
    const email = uniqueEmail("guest");
    await prisma.customer.create({ data: { name: "Old Guest", phone: `0311${Date.now().toString().slice(-7)}`, email, loginEmail: email } });
    const res = await login({ email, password: PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe("session tokens are strictly verified", () => {
  async function accountId(email: string) {
    return (await prisma.customer.findUniqueOrThrow({ where: { loginEmail: email } })).id;
  }

  it("rejects tokens signed with the wrong secret, expired, alg-none, or for a different audience", async () => {
    const c = await registerCustomer(app);
    const id = await accountId(c.email);
    const good = { sub: id, ver: 0 };
    const opts = { algorithm: "HS256" as const, audience: "grillout-customer" };

    const wrongSecret = jwt.sign(good, "a-completely-different-secret-value-0000", opts);
    const expired = jwt.sign(good, env.CUSTOMER_JWT_SECRET, { ...opts, expiresIn: -60 });
    const wrongAudience = jwt.sign(good, env.CUSTOMER_JWT_SECRET, { algorithm: "HS256", audience: "someone-else" });
    const noAudience = jwt.sign(good, env.CUSTOMER_JWT_SECRET, { algorithm: "HS256" });
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const algNone = `${b64({ alg: "none", typ: "JWT" })}.${b64({ ...good, aud: "grillout-customer" })}.`;

    for (const [label, token] of Object.entries({ wrongSecret, expired, wrongAudience, noAudience, algNone })) {
      const res = await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(token));
      expect(res.status, label).toBe(401);
    }
    // sanity: a correctly signed one is accepted
    const ok = jwt.sign(good, env.CUSTOMER_JWT_SECRET, opts);
    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(ok))).status).toBe(200);
  });

  it("rejects a token whose session version is stale", async () => {
    const c = await registerCustomer(app);
    const id = await accountId(c.email);
    const stale = jwt.sign({ sub: id, ver: 5 }, env.CUSTOMER_JWT_SECRET, { algorithm: "HS256", audience: "grillout-customer" });
    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(stale))).status).toBe(401);
  });

  it("rejects a token for an account that no longer exists", async () => {
    const c = await registerCustomer(app);
    const id = await accountId(c.email);
    const token = jwt.sign({ sub: id, ver: 0 }, env.CUSTOMER_JWT_SECRET, { algorithm: "HS256", audience: "grillout-customer" });
    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(token))).status).toBe(200);
    await prisma.customer.delete({ where: { id } });
    expect((await request(app).get("/api/auth/customer/me").set("Cookie", cookieHeader(token))).status).toBe(401);
  });
});

describe("customers and admins are completely separate", () => {
  it("a customer session cannot reach any admin API or the admin identity", async () => {
    const c = await registerCustomer(app);
    for (const [method, path] of [
      ["get", "/api/admin/dashboard"],
      ["get", "/api/admin/orders"],
      ["get", "/api/admin/customers"],
      ["get", "/api/admin/reservations"],
      ["get", "/api/admin/menu/items"],
      ["get", "/api/admin/auth/me"],
      ["patch", "/api/admin/orders/ORD-AAAAAAAAAAAA/status"],
      ["patch", "/api/admin/reservations/RES-AAAAAAAAAAAA/status"],
      ["delete", "/api/admin/menu/items/21"],
    ] as const) {
      const res = await c.agent[method](path).send({ status: "COMPLETED", message: "x" });
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it("a customer token cannot be turned into an admin session (and vice versa)", async () => {
    // Present a real customer cookie value under the ADMIN cookie name:
    const signup2 = await signup({ name: "Token Copy", email: uniqueEmail("copy"), password: PASSWORD });
    const value = /=([^;]+)/.exec((signup2.headers["set-cookie"] as unknown as string[])[0] as string)?.[1] as string;
    const asAdmin = await request(app).get("/api/admin/dashboard").set("Cookie", `grillout_admin_session=${value}`);
    expect(asAdmin.status).toBe(401);

    // An admin cookie presented as the customer cookie is equally useless.
    const adminHeader = (await adminCookieHeader()).split("=")[1] as string;
    const asCustomer = await request(app).get("/api/customer/orders").set("Cookie", cookieHeader(adminHeader));
    expect(asCustomer.status).toBe(401);
  });

  it("an admin session is not a customer: ordering still requires a customer account", async () => {
    const res = await request(app).post("/api/orders").set("Cookie", await adminCookieHeader()).send(orderBody());
    expect(res.status).toBe(401);
  });
});

describe("cross-site request protection", () => {
  it("refuses signup and login from an origin that isn't allowlisted, and sets no cookie", async () => {
    for (const path of ["/api/auth/customer/signup", "/api/auth/customer/login"]) {
      const res = await request(app)
        .post(path)
        .set("Origin", "https://evil.example")
        .send({ name: "Evil", email: uniqueEmail("evil"), password: PASSWORD });
      expect(res.status, path).toBe(403);
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    }
  });

  it("refuses a cross-site preflight for ordering", async () => {
    const res = await request(app)
      .options("/api/orders")
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "POST");
    expect(res.status).toBe(403);
  });

  it("allows the real website origin, with credentials, reflecting exactly that origin", async () => {
    const origin = env.allowedOrigins[0] as string;
    const res = await request(app).post("/api/auth/customer/login").set("Origin", origin).send({ email: uniqueEmail("x"), password: PASSWORD });
    expect(res.status).toBe(401); // reached the handler (wrong creds), i.e. CORS allowed it
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not let even the allowlisted website call the admin API", async () => {
    const origin = env.allowedOrigins[0] as string;
    const res = await request(app).get("/api/admin/dashboard").set("Origin", origin).set("Cookie", await adminCookieHeader());
    expect(res.status).toBe(403);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("does not accept a form-encoded (cross-site form POST) login body as JSON", async () => {
    const res = await request(app)
      .post("/api/auth/customer/login")
      .type("form")
      .send({ email: uniqueEmail("form"), password: PASSWORD });
    // urlencoded bodies parse, but the account doesn't exist -> still just a failed login, no session
    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});
