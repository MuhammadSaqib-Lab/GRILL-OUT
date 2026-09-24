import type { Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

// Deliberately generic: echoing the requested URL back would reflect
// attacker-controlled text and confirm nothing useful to a legitimate client.
export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, "ROUTE_NOT_FOUND", "The requested endpoint does not exist.");
}
