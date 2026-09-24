import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { writeRateLimiter } from "../middleware/rateLimiter";
import { requireCustomer } from "../middleware/requireCustomer";
import { validateRequest } from "../middleware/validateRequest";
import { createOrderSchema, orderIdParamSchema } from "../validators/order.validator";

// Ordering needs an account. Looking orders up is done through the
// authenticated /api/customer/orders routes — there is no public lookup by id.
export const orderRouter = Router();

orderRouter.post(
  "/",
  requireCustomer,
  writeRateLimiter,
  validateRequest({ body: createOrderSchema }),
  orderController.create
);
orderRouter.post(
  "/:id/cancel",
  requireCustomer,
  writeRateLimiter,
  validateRequest({ params: orderIdParamSchema }),
  orderController.cancel
);
