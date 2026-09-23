import type { NextFunction, Request, Response } from "express";
import { adminCookie, verifyAdminToken } from "../utils/adminToken";
import { ApiError } from "../utils/ApiError";

/** Every `/api/admin/*` route except login sits behind this. Hiding the
 * admin UI's pages is not authentication — this is: it verifies a signed,
 * httpOnly-cookie-carried JWT server-side on every single request, and
 * rejects with 401 if it's missing, malformed, expired, or tampered with. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[adminCookie.name] as string | undefined;
  if (!token) {
    next(ApiError.unauthorized("Admin session required"));
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    next(ApiError.unauthorized("Admin session is invalid or has expired"));
    return;
  }

  req.admin = payload;
  next();
}
