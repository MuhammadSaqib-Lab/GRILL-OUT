import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PASSWORD, uniqueEmail } from "./helpers";

// The limiters read their cap from the environment when the module loads, so
// this file loads the app fresh with a small cap instead of sharing the
// 1000-per-window value the rest of the suite runs with.
let app: import("express").Express;

beforeAll(async () => {
  vi.stubEnv("CUSTOMER_AUTH_RATE_LIMIT_MAX", "3");
  vi.resetModules();
  const { createApp } = await import("../src/app");
  app = createApp();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("customer auth rate limiting", () => {
  it("locks out login after the configured number of attempts", async () => {
    const attempt = () => request(app).post("/api/auth/customer/login").send({ email: uniqueEmail("rl"), password: PASSWORD });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    expect(blocked.headers["set-cookie"]).toBeUndefined();
  });

  it("counts signup separately from login, and limits it too", async () => {
    const signup = (n: number) =>
      request(app).post("/api/auth/customer/signup").send({ name: `Rate Limit ${n}`, email: uniqueEmail("rls"), password: PASSWORD });
    // login is already locked out above, yet signup still has its own budget
    for (let i = 0; i < 3; i++) expect((await signup(i)).status).toBe(201);

    const blocked = await signup(99);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
