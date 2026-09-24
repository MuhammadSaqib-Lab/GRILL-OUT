import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { CustomerJwtPayload } from "../types/customer.types";

// Customer sessions use their OWN secret, cookie name and audience claim.
// An admin token can't be replayed here (different secret), and a customer
// token can't be replayed against /api/admin (different secret + cookie).
const COOKIE_NAME = env.isProduction ? "__Host-grillout_session" : "grillout_session";
const ALGORITHM = "HS256" as const;
const AUDIENCE = "grillout-customer";

export function signCustomerToken(payload: CustomerJwtPayload): string {
  return jwt.sign(payload, env.CUSTOMER_JWT_SECRET, {
    algorithm: ALGORITHM,
    audience: AUDIENCE,
    expiresIn: `${env.CUSTOMER_SESSION_DAYS}d`,
  });
}

/** Payload, or null for anything invalid/expired/wrong-audience. */
export function verifyCustomerToken(token: string): CustomerJwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.CUSTOMER_JWT_SECRET, { algorithms: [ALGORITHM], audience: AUDIENCE });
    if (typeof decoded === "string") return null;
    const { sub, ver } = decoded as Partial<CustomerJwtPayload>;
    if (typeof sub !== "string" || typeof ver !== "number") return null;
    return { sub, ver };
  } catch {
    return null;
  }
}

export const customerCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    // Lax (not Strict): the customer arrives from links/emails and must still
    // be recognised. Cross-site POSTs never carry it, and the CORS origin
    // allowlist rejects cross-site API calls outright.
    sameSite: "lax" as const,
    secure: env.isProduction,
    maxAge: env.CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  },
};
