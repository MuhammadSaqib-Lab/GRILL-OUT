import type { CorsOptions, CorsOptionsDelegate } from "cors";
import type { Request } from "express";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

const baseCorsOptions: Omit<CorsOptions, "origin"> = {
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
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

  if (!origin || origin === selfOrigin || env.allowedOrigins.includes(origin)) {
    callback(null, { ...baseCorsOptions, origin: true });
    return;
  }

  callback(new ApiError(403, "CORS_NOT_ALLOWED", `Origin ${origin} is not allowed by CORS policy.`));
};
