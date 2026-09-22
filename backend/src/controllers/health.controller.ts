import type { Request, Response } from "express";
import { env } from "../config/env";
import { sendSuccess } from "../utils/apiResponse";

const startedAt = Date.now();

export const healthController = {
  check(_req: Request, res: Response) {
    sendSuccess(res, {
      status: "ok",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  },
};
