import type { CorsOptions } from "cors";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

// Allowlist-based CORS — only origins listed in FRONTEND_URL (see .env.example)
// may call this API with credentials-free requests. No wildcard in production.
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl, and server-to-server calls send no Origin header.
    if (!origin) return callback(null, true);

    if (env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new ApiError(403, "CORS_NOT_ALLOWED", `Origin ${origin} is not allowed by CORS policy.`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
  maxAge: 600,
};
