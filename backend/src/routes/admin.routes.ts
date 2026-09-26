import { Router } from "express";
import {
  adminAuthController,
  adminCustomerController,
  adminDashboardController,
  adminMenuController,
  adminOrderController,
  adminReservationController,
} from "../controllers/admin.controller";
import { adminLoginRateLimiter } from "../middleware/rateLimiter";
import { requireAdmin } from "../middleware/requireAdmin";
import { validateRequest } from "../middleware/validateRequest";
import {
  adminCreateCategorySchema,
  adminCreateMenuItemSchema,
  adminCustomerListQuerySchema,
  adminLoginSchema,
  adminOrderListQuerySchema,
  adminReservationListQuerySchema,
  adminUpdateCategorySchema,
  adminUpdateMenuItemSchema,
  adminUpdateOrderStatusSchema,
  adminUpdateReservationStatusSchema,
  customerIdParamSchema,
  idParamSchema,
} from "../validators/admin.validator";
import { orderIdParamSchema } from "../validators/order.validator";
import { reservationIdParamSchema } from "../validators/reservation.validator";

export const adminRouter = Router();

// ---- Auth (no requireAdmin — this IS the auth) -------------------------------
adminRouter.post(
  "/auth/login",
  adminLoginRateLimiter,
  validateRequest({ body: adminLoginSchema }),
  adminAuthController.login
);
adminRouter.post("/auth/logout", adminAuthController.logout);

// Everything below requires a valid admin session, verified server-side on
// every request — the admin UI's pages are not themselves the protection.
adminRouter.use(requireAdmin);

adminRouter.get("/auth/me", adminAuthController.me);

adminRouter.get("/dashboard", adminDashboardController.overview);

adminRouter.get("/orders", validateRequest({ query: adminOrderListQuerySchema }), adminOrderController.list);
adminRouter.get("/orders/:id", validateRequest({ params: orderIdParamSchema }), adminOrderController.getById);
adminRouter.patch(
  "/orders/:id/status",
  validateRequest({ params: orderIdParamSchema, body: adminUpdateOrderStatusSchema }),
  adminOrderController.updateStatus
);

adminRouter.get(
  "/reservations",
  validateRequest({ query: adminReservationListQuerySchema }),
  adminReservationController.list
);
adminRouter.get(
  "/reservations/:id",
  validateRequest({ params: reservationIdParamSchema }),
  adminReservationController.getById
);
adminRouter.patch(
  "/reservations/:id/status",
  validateRequest({ params: reservationIdParamSchema, body: adminUpdateReservationStatusSchema }),
  adminReservationController.updateStatus
);

adminRouter.get("/customers", validateRequest({ query: adminCustomerListQuerySchema }), adminCustomerController.list);
adminRouter.get("/customers/:id", validateRequest({ params: customerIdParamSchema }), adminCustomerController.getDetail);

adminRouter.get("/menu/categories", adminMenuController.listCategories);
adminRouter.post(
  "/menu/categories",
  validateRequest({ body: adminCreateCategorySchema }),
  adminMenuController.createCategory
);
adminRouter.patch(
  "/menu/categories/:id",
  validateRequest({ params: idParamSchema, body: adminUpdateCategorySchema }),
  adminMenuController.updateCategory
);
adminRouter.delete(
  "/menu/categories/:id",
  validateRequest({ params: idParamSchema }),
  adminMenuController.deleteCategory
);

adminRouter.get("/menu/items", adminMenuController.listItems);
adminRouter.post("/menu/items", validateRequest({ body: adminCreateMenuItemSchema }), adminMenuController.createItem);
adminRouter.patch(
  "/menu/items/:id",
  validateRequest({ params: idParamSchema, body: adminUpdateMenuItemSchema }),
  adminMenuController.updateItem
);
adminRouter.delete("/menu/items/:id", validateRequest({ params: idParamSchema }), adminMenuController.deleteItem);
