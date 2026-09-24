import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AdminJwtPayload } from "../types/admin.types";

// In production the "__Host-" prefix makes browsers refuse the cookie unless
// it is Secure, has Path=/, and has no Domain — it can't be overwritten by a
// sibling subdomain. (The prefix is not allowed over plain http, so dev/test
// use the bare name.)
const COOKIE_NAME = env.isProduction ? "__Host-grillout_admin_session" : "grillout_admin_session";

const ALGORITHM = "HS256" as const;

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.ADMIN_JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: `${env.ADMIN_SESSION_HOURS}h`,
  });
}

/** Returns the decoded payload, or null for anything invalid/expired —
 * callers treat null as "not authenticated", never distinguishing why.
 * The accepted algorithm is pinned so a token can't downgrade it (e.g. "none"). */
export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET, { algorithms: [ALGORITHM] });
    if (typeof decoded === "string") return null;
    const { sub, email, ver } = decoded as Partial<AdminJwtPayload>;
    if (typeof sub !== "string" || typeof email !== "string" || typeof ver !== "number") return null;
    return { sub, email, ver };
  } catch {
    return null;
  }
}

export const adminCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    // The admin UI is served from the same origin as the API, so "strict"
    // costs nothing and the cookie is never sent on cross-site requests.
    sameSite: "strict" as const,
    secure: env.isProduction,
    maxAge: env.ADMIN_SESSION_HOURS * 60 * 60 * 1000,
    path: "/",
  },
};
