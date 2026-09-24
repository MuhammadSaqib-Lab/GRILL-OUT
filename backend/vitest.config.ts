import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      FRONTEND_URL: "http://localhost:5500",
      DELIVERY_FEE: "150",
      RATE_LIMIT_WINDOW_MS: "900000",
      // High enough that the rate-limit test suite itself never trips it
      // unintentionally on unrelated tests sharing the same limiter instance.
      RATE_LIMIT_MAX: "1000",
      // Signups/logins in the test suite are frequent; the dedicated rate-limit
      // test (customerRateLimit.test.ts) re-imports the app with a low value.
      CUSTOMER_AUTH_RATE_LIMIT_MAX: "1000",
      // Never send real mail from tests, whatever is in a developer's .env.
      SMTP_HOST: "",
      // A dedicated database, migrated + seeded the same way as dev (see
      // DATABASE.md) — tests never run against the real dev/prod data.
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/grillout_test?schema=public",
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
