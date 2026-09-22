import type { Request, Response } from "express";
import { reservationService } from "../services/reservation.service";
import type { CreateReservationInput } from "../validators/reservation.validator";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const reservationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationService.createReservation(req.body as CreateReservationInput);
    sendSuccess(res, reservation, 201, "Reservation confirmed");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const reservation = await reservationService.getReservationById(id);
    sendSuccess(res, reservation);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const reservation = await reservationService.cancelReservation(id);
    sendSuccess(res, reservation, 200, "Reservation cancelled");
  }),
};
