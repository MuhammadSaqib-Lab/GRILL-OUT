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

// Deliberately stricter and keyed only to the login endpoint — brute-forcing
// the admin password is a much higher-value target than spamming an order.
export const adminLoginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.ADMIN_LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "RATE_LIMITED", "Too many login attempts — please try again later.");
  },
});

// Customer signup and login each get their own counter (so a burst of signups
// doesn't lock out logins from the same network, and vice versa).
function customerAuthLimiter(message: string) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.CUSTOMER_AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(res, 429, "RATE_LIMITED", message);
    },
  });
}

export const customerSignupRateLimiter = customerAuthLimiter("Too many sign-up attempts — please try again later.");
export const customerLoginRateLimiter = customerAuthLimiter("Too many login attempts — please try again later.");
