import type { Request, Response } from "express";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

const startedAt = Date.now();

export const healthController = {
  // The server responding at all is "healthy" — a down database degrades
  // functionality but shouldn't itself look like the API is unreachable
  // (that's a distinct, more useful signal than a bare 503 would be). Never
  // returns DATABASE_URL, credentials, or any other connection detail.
  check: asyncHandler(async (_req: Request, res: Response) => {
    let database: "connected" | "unavailable" = "unavailable";

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch (err) {
      logger.error("Health check: database unreachable", {
        message: err instanceof Error ? err.message : String(err),
      });
    }

    sendSuccess(res, {
      status: database === "connected" ? "ok" : "degraded",
      database,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  }),
};
