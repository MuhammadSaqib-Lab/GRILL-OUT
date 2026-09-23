import "dotenv/config";
import { z } from "zod";

// Fail fast and loud if the environment is misconfigured, rather than
// limping along with `undefined` sprinkled through the app.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z
    .string()
    .min(1, "FRONTEND_URL must list at least one allowed origin")
    .default("http://localhost:5500"),
  DELIVERY_FEE: z.coerce.number().nonnegative().default(150),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
      message: "DATABASE_URL must be a postgresql:// connection string",
    }),

  // Admin dashboard auth. ADMIN_EMAIL/ADMIN_PASSWORD are read only by
  // prisma/seed.ts to bootstrap the first AdminUser (hashed before it ever
  // touches the database) — the running server never reads them again.
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, "ADMIN_JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),
  ADMIN_EMAIL: z.string().email().default("admin@grillout.local"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters").default("ChangeMe123!"),
  ADMIN_SESSION_HOURS: z.coerce.number().positive().default(8),
  ADMIN_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Refusing to start with invalid environment configuration.");
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
  isTest: parsed.data.NODE_ENV === "test",
  allowedOrigins: parsed.data.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean),
};
