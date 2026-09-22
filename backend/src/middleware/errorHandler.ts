import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/** Last middleware in the chain. Every thrown/forwarded error — validation,
 * expected (ApiError), or truly unexpected — lands here and leaves as the
 * standard { success: false, error } shape. Stack traces are logged
 * server-side only and never sent to the client. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    logger.warn("Validation error", { path: req.originalUrl, fieldErrors });
    sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", fieldErrors);
    return;
  }

  // express.json() throws a SyntaxError (with a body-parser-assigned status
  // of 400) for malformed request bodies — that's a client mistake, not a
  // server fault, so it must not fall through to the generic 500 below.
  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    logger.warn("Malformed JSON body", { path: req.originalUrl });
    sendError(res, 400, "MALFORMED_JSON", "Request body is not valid JSON");
    return;
  }

  if (err instanceof ApiError) {
    // Client errors (4xx) are expected traffic, not incidents — info level.
    // Anything the caller mis-typed still gets logged so patterns are visible.
    logger.info(`${err.code}: ${err.message}`, { path: req.originalUrl, statusCode: err.statusCode });
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error("Unhandled error", { path: req.originalUrl, message, stack });

  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Something went wrong on our end. Please try again shortly.",
    env.isDevelopment ? { message, stack } : undefined
  );
}
