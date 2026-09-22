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
