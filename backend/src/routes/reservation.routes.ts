import { Router } from "express";
import { reservationController } from "../controllers/reservation.controller";
import { writeRateLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { createReservationSchema, reservationIdParamSchema } from "../validators/reservation.validator";

export const reservationRouter = Router();

reservationRouter.post(
  "/",
  writeRateLimiter,
  validateRequest({ body: createReservationSchema }),
  reservationController.create
);
reservationRouter.get(
  "/:id",
  validateRequest({ params: reservationIdParamSchema }),
  reservationController.getById
);
reservationRouter.post(
  "/:id/cancel",
  writeRateLimiter,
  validateRequest({ params: reservationIdParamSchema }),
  reservationController.cancel
);
