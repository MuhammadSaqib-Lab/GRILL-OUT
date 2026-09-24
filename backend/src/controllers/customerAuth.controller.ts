import type { Request, Response } from "express";
import { customerAuthService } from "../services/customerAuth.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { customerCookie, verifyCustomerToken } from "../utils/customerToken";
import type { CustomerLoginInput, CustomerSignupInput } from "../validators/customer.validator";

export const customerAuthController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const { token, profile } = await customerAuthService.signup(req.body as CustomerSignupInput);
    res.cookie(customerCookie.name, token, customerCookie.options);
    sendSuccess(res, profile, 201, "Account created");
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { token, profile } = await customerAuthService.login(req.body as CustomerLoginInput);
    res.cookie(customerCookie.name, token, customerCookie.options);
    sendSuccess(res, profile, 200, "Logged in");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[customerCookie.name] as string | undefined;
    const payload = token ? verifyCustomerToken(token) : null;
    await customerAuthService.logout(payload?.sub);
    res.clearCookie(customerCookie.name, { ...customerCookie.options, maxAge: undefined });
    sendSuccess(res, null, 200, "Logged out");
  }),

  // Only name + email. requireCustomer already loaded the row; nothing else leaves.
  me: asyncHandler(async (req: Request, res: Response) => {
    const customer = req.customer as NonNullable<Request["customer"]>;
    sendSuccess(res, { name: customer.name, email: customer.email });
  }),
};
