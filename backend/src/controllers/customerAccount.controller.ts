import type { Request, Response } from "express";
import { orderService } from "../services/order.service";
import { reservationService } from "../services/reservation.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// Every handler here scopes by req.customer.id — the id in the verified
// session. There is deliberately no customer id parameter anywhere.
const me = (req: Request) => req.customer as NonNullable<Request["customer"]>;

export const customerAccountController = {
  listOrders: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await orderService.listOrdersForCustomer(me(req).id));
  }),

  getOrder: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    sendSuccess(res, await orderService.getOrderForCustomer(id, me(req).id));
  }),

  listReservations: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await reservationService.listReservationsForCustomer(me(req).id));
  }),

  getReservation: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    sendSuccess(res, await reservationService.getReservationForCustomer(id, me(req).id));
  }),
};
