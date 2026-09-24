import type { Request, Response } from "express";
import { emailService } from "../services/email.service";
import { reservationService } from "../services/reservation.service";
import type { CreateReservationInput } from "../validators/reservation.validator";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// req.customer comes from the verified session (requireCustomer) — never from the client.
const me = (req: Request) => req.customer as NonNullable<Request["customer"]>;

export const reservationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationService.createReservation(req.body as CreateReservationInput, me(req));
    // Fire-and-forget: a mail problem must never fail a reservation.
    emailService.notifyNewReservation(reservation);
    sendSuccess(res, reservation, 201, "Reservation received");
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: string };
    const reservation = await reservationService.cancelReservation(id, me(req).id);
    sendSuccess(res, reservation, 200, "Reservation cancelled");
  }),
};
