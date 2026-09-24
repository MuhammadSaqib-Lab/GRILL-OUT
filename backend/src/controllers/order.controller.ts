import type { Request, Response } from "express";
import { emailService } from "../services/email.service";
import { orderService } from "../services/order.service";
import type { CreateOrderInput } from "../validators/order.validator";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// req.customer is set by requireCustomer from the verified session — the
// customer is never taken from the request body, query or path.
const me = (req: Request) => req.customer as NonNullable<Request["customer"]>;

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.createOrder(req.body as CreateOrderInput, me(req));
    // Fire-and-forget: a mail problem must never fail or delay an order.
    emailService.notifyNewOrder(order);
    sendSuccess(res, order, 201, "Order placed successfully");
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const order = await orderService.cancelOrder(id, me(req).id);
    sendSuccess(res, order, 200, "Order cancelled");
  }),
};
