import { Router } from "express";
import { reservationController } from "../controllers/reservation.controller";
import { writeRateLimiter } from "../middleware/rateLimiter";
import { requireCustomer } from "../middleware/requireCustomer";
import { validateRequest } from "../middleware/validateRequest";
import { createReservationSchema, reservationIdParamSchema } from "../validators/reservation.validator";

// Reserving needs an account. Looking reservations up is done through the
// authenticated /api/customer/reservations routes — there is no public lookup by id.
export const reservationRouter = Router();

reservationRouter.post(
  "/",
  requireCustomer,
  writeRateLimiter,
  validateRequest({ body: createReservationSchema }),
  reservationController.create
);
reservationRouter.post(
  "/:id/cancel",
  requireCustomer,
  writeRateLimiter,
  validateRequest({ params: reservationIdParamSchema }),
  reservationController.cancel
);
