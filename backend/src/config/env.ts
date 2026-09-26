import "dotenv/config";
import { z } from "zod";

// Fail fast and loud if the environment is misconfigured, rather than
// limping along with `undefined` sprinkled through the app.
// A blank line in .env (`ADMIN_EMAIL=`) means "not set", not "invalid".
const optionalEmail = z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional());

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

  // Admin dashboard auth. The admin's email/password are deliberately NOT part
  // of this schema and have no defaults: the running server never needs them
  // (it only verifies logins against the stored bcrypt hash). They are read
  // solely by `npm run admin:setup` (scripts/setup-admin.ts), which validates
  // them and stores only a hash — see DEPLOYMENT.md.
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, "ADMIN_JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),
  ADMIN_SESSION_HOURS: z.coerce.number().positive().max(72).default(8),
  ADMIN_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Customer accounts (public website). A DIFFERENT secret from the admin one,
  // so a customer session token can never be accepted as an admin token or
  // vice versa, even if one secret leaked.
  CUSTOMER_JWT_SECRET: z
    .string()
    .min(32, "CUSTOMER_JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),
  CUSTOMER_SESSION_DAYS: z.coerce.number().positive().max(90).default(30),
  // Per IP, per window, applied separately to signup and to login.
  CUSTOMER_AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Email. With no SMTP_HOST, mail is not sent: each message is logged as a
  // one-line "would send" entry (recipient + subject only) so development and
  // CI never need real credentials. In production SMTP_HOST is required.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().min(3).default("Grill Out <no-reply@grillout.local>"),
  // Where "new order" / "new reservation" alerts go. Falls back to ADMIN_EMAIL
  // if that happens to be set; with neither, alerts are skipped (and logged).
  ADMIN_NOTIFY_EMAIL: optionalEmail,
  ADMIN_EMAIL: optionalEmail,

  // The restaurant's own timezone (IANA name). "Today" in the dashboard and the
  // reservation date/time checks use it, whatever timezone the server runs in.
  RESTAURANT_TIMEZONE: z
    .string()
    .default("Asia/Karachi")
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "RESTAURANT_TIMEZONE must be a valid IANA timezone, e.g. Asia/Karachi"),

  // Number of reverse-proxy hops in front of this app (0 = none/direct).
  // Rate limiting keys on the client IP, which behind a proxy is only correct
  // if Express is told how many hops to trust — see DEPLOYMENT.md.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

const parsed = envSchema
  .refine((v) => v.CUSTOMER_JWT_SECRET !== v.ADMIN_JWT_SECRET, {
    path: ["CUSTOMER_JWT_SECRET"],
    message: "CUSTOMER_JWT_SECRET must differ from ADMIN_JWT_SECRET",
  })
  .safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Refusing to start with invalid environment configuration.");
}

// Production must never boot with the development placeholders that ship in
// .env.example / the schema defaults above.
if (parsed.data.NODE_ENV === "production") {
  const problems: string[] = [];
  if (/replace-with|change-this|changeme/i.test(parsed.data.ADMIN_JWT_SECRET)) {
    problems.push("ADMIN_JWT_SECRET is still a placeholder");
  }
  if (/replace-with|change-this|changeme/i.test(parsed.data.CUSTOMER_JWT_SECRET)) {
    problems.push("CUSTOMER_JWT_SECRET is still a placeholder");
  }
  if (!parsed.data.SMTP_HOST) {
    problems.push("SMTP_HOST is required in production (order/reservation emails would silently not be sent)");
  }
  if (!parsed.data.ADMIN_NOTIFY_EMAIL && !parsed.data.ADMIN_EMAIL) {
    problems.push("ADMIN_NOTIFY_EMAIL is required in production (the restaurant would never be told about new orders/reservations)");
  }
  const badOrigins = parsed.data.FRONTEND_URL.split(",")
    .map((o) => o.trim())
    .filter((o) => o && (!o.startsWith("https://") || /localhost|127\.0\.0\.1/.test(o)));
  if (badOrigins.length > 0) {
    problems.push("FRONTEND_URL must list only https:// production origins (no localhost)");
  }
  if (problems.length > 0) {
    console.error("Unsafe production configuration:", problems);
    throw new Error("Refusing to start with unsafe production configuration.");
  }
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
  isTest: parsed.data.NODE_ENV === "test",
  allowedOrigins: parsed.data.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean),
};
