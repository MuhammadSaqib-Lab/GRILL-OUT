import type { NextFunction, Request, Response } from "express";
import { adminUserRepository } from "../repositories/admin.repository";
import { adminCookie, verifyAdminToken } from "../utils/adminToken";
import { ApiError } from "../utils/ApiError";

/** Every `/api/admin/*` route except login/logout sits behind this. Hiding
 * the admin UI's pages is not authentication — this is: it verifies a signed,
 * httpOnly-cookie-carried JWT server-side on every single request, then
 * confirms against the database that the admin account still exists and the
 * token's session version is current (so logout, or deleting the account,
 * revokes access immediately rather than at token expiry). Anything else is
 * a 401 with the same generic message. */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[adminCookie.name] as string | undefined;
    const payload = token ? verifyAdminToken(token) : null;
    if (!payload) {
      next(ApiError.unauthorized("Admin session required"));
      return;
    }

    const admin = await adminUserRepository.findById(payload.sub);
    if (!admin || admin.sessionVersion !== payload.ver) {
      next(ApiError.unauthorized("Admin session required"));
      return;
    }

    req.admin = payload;
    next();
  } catch (err) {
    next(err);
  }
}
