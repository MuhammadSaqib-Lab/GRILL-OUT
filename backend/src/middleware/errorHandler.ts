import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/apiResponse";
import { logger } from "../utils/logger";

// Maps the handful of Prisma error codes this app can actually hit to safe,
// user-facing responses. Never forwards Prisma's own message (it can
// mention table/column names) — always a generic, code-appropriate one.
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response
): boolean {
  switch (err.code) {
    case "P2002": // unique constraint violation
      logger.warn("Unique constraint violation", { path: req.path, target: err.meta?.target });
      sendError(res, 409, "CONFLICT", "A record with that value already exists.");
      return true;
    case "P2003": // foreign key constraint violation
      logger.warn("Foreign key violation", { path: req.path, field: err.meta?.field_name });
      sendError(res, 400, "BAD_REQUEST", "This request references something that doesn't exist.");
      return true;
    case "P2025": // record required for operation was not found
      logger.info("Record not found for update/delete", { path: req.path });
      sendError(res, 404, "NOT_FOUND", "The requested record was not found.");
      return true;
    default:
      return false;
  }
}

/** Last middleware in the chain. Every thrown/forwarded error — validation,
 * expected (ApiError), or truly unexpected — lands here and leaves as the
 * standard { success: false, error } shape. Stack traces are logged
 * server-side only and never sent to the client. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    logger.warn("Validation error", { path: req.path, fieldErrors });
    sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", fieldErrors);
    return;
  }

  // express.json() throws a SyntaxError (with a body-parser-assigned status
  // of 400) for malformed request bodies — that's a client mistake, not a
  // server fault, so it must not fall through to the generic 500 below.
  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    logger.warn("Malformed JSON body", { path: req.path });
    sendError(res, 400, "MALFORMED_JSON", "Request body is not valid JSON");
    return;
  }

  if (err instanceof ApiError) {
    // Client errors (4xx) are expected traffic, not incidents — info level.
    // Anything the caller mis-typed still gets logged so patterns are visible.
    logger.info(`${err.code}: ${err.message}`, { path: req.path, statusCode: err.statusCode });
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && handlePrismaError(err, req, res)) {
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError || err instanceof Prisma.PrismaClientRustPanicError) {
    logger.error("Database connection failure", { path: req.path, message: err.message });
    sendError(res, 503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable. Please try again shortly.");
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    // A malformed Prisma query got this far — a bug, not the caller's
    // fault, but still not something to describe to them in detail.
    logger.error("Prisma validation error", { path: req.path, message: err.message });
    sendError(res, 500, "INTERNAL_ERROR", "Something went wrong on our end. Please try again shortly.");
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error("Unhandled error", { path: req.path, message, stack });

  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Something went wrong on our end. Please try again shortly.",
    env.isDevelopment ? { message, stack } : undefined
  );
}
