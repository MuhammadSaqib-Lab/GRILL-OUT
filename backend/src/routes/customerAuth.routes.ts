import { Router } from "express";
import { customerAuthController } from "../controllers/customerAuth.controller";
import { customerLoginRateLimiter, customerSignupRateLimiter } from "../middleware/rateLimiter";
import { requireCustomer } from "../middleware/requireCustomer";
import { validateRequest } from "../middleware/validateRequest";
import { sendSuccess } from "../utils/apiResponse";
import { customerLoginSchema, customerSignupSchema } from "../validators/customer.validator";

export const customerAuthRouter = Router();

customerAuthRouter.post(
  "/signup",
  customerSignupRateLimiter,
  validateRequest({ body: customerSignupSchema }),
  customerAuthController.signup
);
customerAuthRouter.post(
  "/login",
  customerLoginRateLimiter,
  validateRequest({ body: customerLoginSchema }),
  customerAuthController.login
);
customerAuthRouter.post("/logout", customerAuthController.logout);
customerAuthRouter.get("/me", requireCustomer, customerAuthController.me);

// Same check as /me, but "not logged in" is a normal 200 answer ({ customer: null }) rather than a 401,
// so every anonymous page view can ask "who am I?" without a red error in the browser console.
customerAuthRouter.get(
  "/session",
  (req, res, next) =>
    requireCustomer(req, res, (err?: unknown) => {
      if (err && (err as { statusCode?: number }).statusCode === 401) {
        sendSuccess(res, { customer: null });
        return;
      }
      next(err);
    }),
  (req, res) => {
    const c = req.customer as NonNullable<typeof req.customer>;
    sendSuccess(res, { customer: { name: c.name, email: c.email } });
  }
);
