import type { NextFunction, Request, Response } from "express";
import { customerRepository } from "../repositories/customer.repository";
import { ApiError } from "../utils/ApiError";
import { customerCookie, verifyCustomerToken } from "../utils/customerToken";

/** Puts the logged-in customer on `req.customer`, or answers 401.
 *
 * The customer is identified ONLY from the signed session cookie, then
 * re-checked against the database (account still exists, has a password, and
 * the token's session version is current — so logout / password change /
 * account removal revoke access immediately). Handlers must use
 * `req.customer.id` and never a customer id from the body, query or path. */
export async function requireCustomer(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[customerCookie.name] as string | undefined;
    const payload = token ? verifyCustomerToken(token) : null;
    if (!payload) {
      next(ApiError.unauthorized("Please log in to continue"));
      return;
    }

    const customer = await customerRepository.findById(payload.sub);
    if (!customer || !customer.passwordHash || !customer.loginEmail || customer.sessionVersion !== payload.ver) {
      next(ApiError.unauthorized("Please log in to continue"));
      return;
    }

    req.customer = { id: customer.id, name: customer.name, email: customer.loginEmail };
    next();
  } catch (err) {
    next(err);
  }
}
