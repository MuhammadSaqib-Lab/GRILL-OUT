import type { Response } from "express";
import type { ApiErrorBody, ApiSuccess } from "../types/api.types";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}) };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const body: ApiErrorBody = { success: false, error: { code, message, ...(details !== undefined ? { details } : {}) } };
  res.status(statusCode).json(body);
}
