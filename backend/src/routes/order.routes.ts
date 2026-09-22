import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { writeRateLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { createOrderSchema, orderIdParamSchema } from "../validators/order.validator";

export const orderRouter = Router();

orderRouter.post("/", writeRateLimiter, validateRequest({ body: createOrderSchema }), orderController.create);
orderRouter.get("/:id", validateRequest({ params: orderIdParamSchema }), orderController.getById);
orderRouter.post(
  "/:id/cancel",
  writeRateLimiter,
  validateRequest({ params: orderIdParamSchema }),
  orderController.cancel
);
