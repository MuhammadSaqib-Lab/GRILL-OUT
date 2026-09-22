import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { sendError } from "../utils/apiResponse";

// Applied only to the write endpoints that matter for abuse (orders,
// reservations) — read-only menu/category browsing stays unlimited to keep
// the site itself snappy.
export const writeRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "RATE_LIMITED", "Too many requests — please try again later.");
  },
});
