import { Router } from "express";
import { customerAuthController } from "../controllers/customerAuth.controller";
import { customerLoginRateLimiter, customerSignupRateLimiter } from "../middleware/rateLimiter";
import { requireCustomer } from "../middleware/requireCustomer";
import { validateRequest } from "../middleware/validateRequest";
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
