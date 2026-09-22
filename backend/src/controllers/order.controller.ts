import type { Request, Response } from "express";
import { orderService } from "../services/order.service";
import type { CreateOrderInput } from "../validators/order.validator";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.createOrder(req.body as CreateOrderInput);
    sendSuccess(res, order, 201, "Order placed successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const order = await orderService.getOrderById(id);
    sendSuccess(res, order);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const order = await orderService.cancelOrder(id);
    sendSuccess(res, order, 200, "Order cancelled");
  }),
};
