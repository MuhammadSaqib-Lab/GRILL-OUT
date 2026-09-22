import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Wraps an async route/controller so a rejected promise reaches the
 * centralized error handler instead of becoming an unhandled rejection. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
