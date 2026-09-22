import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRouter } from "./routes";
import { logger } from "./utils/logger";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));

  // 10kb is generous for the JSON this API ever receives (a cart's worth of
  // order lines, a reservation form) and cheap insurance against oversized bodies.
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  if (!env.isTest) {
    app.use(
      morgan(env.isDevelopment ? "dev" : "combined", {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
