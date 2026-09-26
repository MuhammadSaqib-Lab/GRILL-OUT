import type { Request, Response } from "express";
import {
  adminAuthService,
  adminCustomerService,
  adminDashboardService,
  adminMenuService,
  adminOrderService,
  adminReservationService,
} from "../services/admin.service";
import { emailService } from "../services/email.service";
import { adminCookie, verifyAdminToken } from "../utils/adminToken";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import type { AdminLoginInput } from "../validators/admin.validator";

export const adminAuthController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { token, profile } = await adminAuthService.login(req.body as AdminLoginInput);
    res.cookie(adminCookie.name, token, adminCookie.options);
    sendSuccess(res, profile, 200, "Logged in");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[adminCookie.name] as string | undefined;
    const payload = token ? verifyAdminToken(token) : null;
    await adminAuthService.logout(payload?.sub);
    res.clearCookie(adminCookie.name, { ...adminCookie.options, maxAge: undefined });
    sendSuccess(res, null, 200, "Logged out");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.admin) throw ApiError.unauthorized("Admin session required");
    const profile = await adminAuthService.getProfile(req.admin.sub);
    sendSuccess(res, profile);
  }),
};

export const adminDashboardController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    const overview = await adminDashboardService.getOverview();
    sendSuccess(res, overview);
  }),
};

export const adminOrderController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminOrderService.list(req.query as never);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const order = await adminOrderService.getById(req.params.id as string);
    sendSuccess(res, order);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { order, notify } = await adminOrderService.updateStatus(req.params.id as string, req.body.status, req.body.message);
    // The customer's account already shows the new status (same row); this also emails them,
    // but only when something actually changed.
    if (notify) emailService.notifyOrderStatus(order);
    sendSuccess(res, order, 200, "Order status updated");
  }),
};

export const adminReservationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminReservationService.list(req.query as never);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const reservation = await adminReservationService.getById(req.params.id as string);
    sendSuccess(res, reservation);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { reservation, notify } = await adminReservationService.updateStatus(
      req.params.id as string,
      req.body.status,
      req.body.message
    );
    if (notify) emailService.notifyReservationStatus(reservation);
    sendSuccess(res, reservation, 200, "Reservation status updated");
  }),
};

export const adminCustomerController = {
  getDetail: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminCustomerService.getDetail(req.params.id as string));
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminCustomerService.list(req.query as never);
    sendSuccess(res, result);
  }),
};

export const adminMenuController = {
  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.listCategories());
  }),
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.createCategory(req.body), 201, "Category created");
  }),
  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.updateCategory(Number(req.params.id), req.body), 200, "Category updated");
  }),
  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminMenuService.deleteCategory(Number(req.params.id));
    sendSuccess(res, result, 200, result.action === "deleted" ? "Category deleted" : "Category deactivated (still has menu items)");
  }),

  listItems: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.listItems());
  }),
  createItem: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.createItem(req.body), 201, "Menu item created");
  }),
  updateItem: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminMenuService.updateItem(Number(req.params.id), req.body), 200, "Menu item updated");
  }),
  deleteItem: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminMenuService.deleteItem(Number(req.params.id));
    sendSuccess(
      res,
      result,
      200,
      result.action === "deleted" ? "Menu item deleted" : "Menu item deactivated (referenced by past orders)"
    );
  }),
};
