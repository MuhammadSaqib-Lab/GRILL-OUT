import { Router } from "express";
import { customerAccountController } from "../controllers/customerAccount.controller";
import { requireCustomer } from "../middleware/requireCustomer";
import { validateRequest } from "../middleware/validateRequest";
import { orderIdParamSchema } from "../validators/order.validator";
import { reservationIdParamSchema } from "../validators/reservation.validator";

// Everything under /api/customer requires a logged-in customer and only ever
// returns that customer's own records.
export const customerAccountRouter = Router();
customerAccountRouter.use(requireCustomer);

customerAccountRouter.get("/orders", customerAccountController.listOrders);
customerAccountRouter.get("/orders/:id", validateRequest({ params: orderIdParamSchema }), customerAccountController.getOrder);
customerAccountRouter.get("/reservations", customerAccountController.listReservations);
customerAccountRouter.get(
  "/reservations/:id",
  validateRequest({ params: reservationIdParamSchema }),
  customerAccountController.getReservation
);
