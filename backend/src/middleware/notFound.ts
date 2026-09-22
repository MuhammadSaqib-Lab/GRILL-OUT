import type { Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, "ROUTE_NOT_FOUND", `No route matches ${req.method} ${req.originalUrl}`);
}
