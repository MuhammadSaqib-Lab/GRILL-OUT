import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { Express } from "express";
import { afterAll } from "vitest";
import { env } from "../src/config/env";
import { prisma } from "../src/config/prisma";
import { adminCookie } from "../src/utils/adminToken";
import { hashPassword } from "../src/utils/password";

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

// Each call gets its own time slot: one customer can't hold two active reservations at the same date+time.
let slot = 0;
export function reservationBody(overrides: Record<string, unknown> = {}) {
  const n = slot++ % 144;
  const time = String(10 + Math.floor(n / 12)).padStart(2, "0") + ":" + String((n % 12) * 5).padStart(2, "0");
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return {
    phone: uniquePhone(),
    date: d.toISOString().slice(0, 10),
    time,
    guests: "3-4",
    ...overrides,
  };
}

// ---- admin --------------------------------------------------------------------
// No admin credential exists anywhere in the repo or the environment, so each
// test file creates its own throwaway admin (random email + random password,
// generated at runtime, deleted afterwards). Separate per file so one file
// logging its admin out can never affect another file running in parallel.

export interface TestAdmin {
  id: string;
  email: string;
  password: string;
}

let sharedAdmin: TestAdmin | undefined;

export async function createTestAdmin(): Promise<TestAdmin> {
  const password = `Aa1-${randomBytes(16).toString("hex")}`;
  const email = `admin-${Date.now()}-${randomBytes(4).toString("hex")}@grillout.test`;
  const row = await prisma.adminUser.create({
    data: { email, passwordHash: await hashPassword(password), name: "Test Admin" },
  });
  return { id: row.id, email, password };
}

/** This file's admin (created on first use). */
export async function testAdmin(): Promise<TestAdmin> {
  sharedAdmin ??= await createTestAdmin();
  return sharedAdmin;
}

afterAll(async () => {
  if (sharedAdmin) await prisma.adminUser.deleteMany({ where: { id: sharedAdmin.id } });
});

/** A Cookie header for this file's admin, signed with the real secret and the
 * account's current session version — the same thing a real login produces. */
export async function adminCookieHeader(): Promise<string> {
  const { id } = await testAdmin();
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id } });
  const token = jwt.sign({ sub: admin.id, email: admin.email, ver: admin.sessionVersion }, env.ADMIN_JWT_SECRET, {
    algorithm: "HS256",
  });
  return `${adminCookie.name}=${token}`;
}
