import type { CorsOptions, CorsOptionsDelegate } from "cors";
import type { Request } from "express";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

const baseCorsOptions: Omit<CorsOptions, "origin"> = {
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  // Customer sessions travel in an httpOnly cookie, so the browser must be
  // allowed to send it cross-origin from the (allowlisted) website. The origin
  // reflected back is always one exact allowlisted value — never "*".
  credentials: true,
  maxAge: 600,
};

// Allowlist-based CORS — only origins listed in FRONTEND_URL (see .env.example)
// may call this API with credentials-free requests. No wildcard in production.
//
// A same-origin POST/PATCH/DELETE still carries an `Origin` header (browsers
// send it on every state-changing request, same-origin or not), so the admin
// UI — served by this same app at /admin — would otherwise get rejected by
// its own API. It's never actually cross-origin, so it's allowed alongside
// the configured allowlist rather than needing its own entry there.
export const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin;
  const selfOrigin = `${req.protocol}://${req.get("host") ?? ""}`;
  // The admin API is only ever called by the admin UI served from this same
  // origin. The public website's origin is allowlisted for the public API, but
  // must not be able to call admin endpoints with an admin's cookie.
  const adminOnly = req.path.startsWith("/api/admin");
  const allowed = adminOnly ? origin === selfOrigin : env.allowedOrigins.includes(origin ?? "") || origin === selfOrigin;

  if (!origin || allowed) {
    callback(null, { ...baseCorsOptions, origin: true });
    return;
  }

  callback(new ApiError(403, "CORS_NOT_ALLOWED", `Origin ${origin} is not allowed by CORS policy.`));
};
