import jwt from "jsonwebtoken";
import request from "supertest";
import type { Express } from "express";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";
import { adminCookie } from "../src/utils/adminToken";

export const PASSWORD = "Sup3rSecret-pw";

export function uniquePhone() {
  return `03${Math.floor(100000000 + Math.random() * 899999999)}`;
}

export function uniqueEmail(prefix = "cust") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}@example.com`;
}

export interface TestCustomer {
  /** supertest agent that keeps this customer's session cookie */
  agent: ReturnType<typeof request.agent>;
  name: string;
  email: string;
  password: string;
}

/** Signs up a brand-new customer through the real API and returns an agent
 * that is logged in as them. */
export async function registerCustomer(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
): Promise<TestCustomer> {
  const name = overrides.name ?? "Test Customer";
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? PASSWORD;
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/customer/signup").send({ name, email, password });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, name, email, password };
}

export function orderBody(overrides: Record<string, unknown> = {}) {
  return {
    phone: uniquePhone(),
    items: [{ menuItemId: 21, quantity: 2 }], // Ba Zinga, Rs. 599 each
    orderType: "pickup",
    ...overrides,
  };
}

export function reservationBody(overrides: Record<string, unknown> = {}) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return {
    phone: uniquePhone(),
    date: d.toISOString().slice(0, 10),
    time: "19:30",
    guests: "3-4",
    ...overrides,
  };
}

/** A Cookie header for the (seeded) admin, signed with the real secret and the
 * account's current session version — same thing a real login produces. */
export async function adminCookieHeader(): Promise<string> {
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { email: env.ADMIN_EMAIL } });
  const token = jwt.sign({ sub: admin.id, email: admin.email, ver: admin.sessionVersion }, env.ADMIN_JWT_SECRET, {
    algorithm: "HS256",
  });
  return `${adminCookie.name}=${token}`;
}
