import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AdminJwtPayload } from "../types/admin.types";

const COOKIE_NAME = "grillout_admin_session";

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.ADMIN_JWT_SECRET, { expiresIn: `${env.ADMIN_SESSION_HOURS}h` });
}

/** Returns the decoded payload, or null for anything invalid/expired —
 * callers treat null as "not authenticated", never distinguishing why. */
export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }
}

export const adminCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    maxAge: env.ADMIN_SESSION_HOURS * 60 * 60 * 1000,
    path: "/",
  },
};
