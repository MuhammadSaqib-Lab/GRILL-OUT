import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A complete, valid production configuration. Each test breaks one thing.
const GOOD: Record<string, string> = {
  NODE_ENV: "production",
  FRONTEND_URL: "https://grillout.example.com",
  ADMIN_JWT_SECRET: "a".repeat(48),
  CUSTOMER_JWT_SECRET: "b".repeat(48),
  SMTP_HOST: "smtp.example.com",
  ADMIN_NOTIFY_EMAIL: "ops@grillout.example.com",
  ALLOW_NO_SMTP: "false",
  ADMIN_EMAIL: "", // a developer's .env must not satisfy the alert-recipient check
};

function setEnv(overrides: Record<string, string> = {}) {
  for (const [k, v] of Object.entries({ ...GOOD, ...overrides })) vi.stubEnv(k, v);
}

async function loadEnv() {
  vi.resetModules();
  return import("../src/config/env");
}

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  error = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("production configuration checks", () => {
  it("boots with a complete configuration", async () => {
    setEnv();
    const { env } = await loadEnv();
    expect(env.isProduction).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it("refuses to boot without SMTP_HOST, and the message names ALLOW_NO_SMTP", async () => {
    setEnv({ SMTP_HOST: "" });
    await expect(loadEnv()).rejects.toThrow(/unsafe production configuration/i);
    expect(JSON.stringify(error.mock.calls)).toContain("ALLOW_NO_SMTP=true");
  });

  it("boots without SMTP_HOST only when ALLOW_NO_SMTP=true, with a loud warning", async () => {
    setEnv({ SMTP_HOST: "", ALLOW_NO_SMTP: "true", ADMIN_NOTIFY_EMAIL: "" });
    const { env } = await loadEnv();
    expect(env.ALLOW_NO_SMTP).toBe(true);
    expect(warn.mock.calls.flat().join(" ")).toContain("NO emails will be sent");
  });

  it("ALLOW_NO_SMTP does not relax the other checks", async () => {
    setEnv({ SMTP_HOST: "", ALLOW_NO_SMTP: "true", ADMIN_JWT_SECRET: "change-this-to-something-long-and-random-1234" });
    await expect(loadEnv()).rejects.toThrow(/unsafe production configuration/i);
    setEnv({ SMTP_HOST: "", ALLOW_NO_SMTP: "true", FRONTEND_URL: "http://localhost:5500" });
    await expect(loadEnv()).rejects.toThrow(/unsafe production configuration/i);
  });

  it("ALLOW_NO_SMTP is ignored when SMTP_HOST is set (no warning, mail still expected)", async () => {
    setEnv({ ALLOW_NO_SMTP: "true" });
    await loadEnv();
    expect(warn).not.toHaveBeenCalled();
  });

  it("with mail on, an alert recipient is still required", async () => {
    setEnv({ ADMIN_NOTIFY_EMAIL: "" });
    await expect(loadEnv()).rejects.toThrow(/unsafe production configuration/i);
  });

  it("only 'true' or 'false' are accepted for ALLOW_NO_SMTP", async () => {
    setEnv({ ALLOW_NO_SMTP: "yes" });
    await expect(loadEnv()).rejects.toThrow(/invalid environment configuration/i);
  });

  it("is off when not set at all", async () => {
    setEnv({ NODE_ENV: "test" });
    delete process.env.ALLOW_NO_SMTP;
    const { env } = await loadEnv();
    expect(env.ALLOW_NO_SMTP).toBe(false);
  });
});
