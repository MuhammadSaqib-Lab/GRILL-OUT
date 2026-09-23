import { createApp } from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./config/prisma";
import { logger } from "./utils/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Grill Out API listening on port ${env.PORT}`, {
    environment: env.NODE_ENV,
    allowedOrigins: env.allowedOrigins,
  });
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    disconnectPrisma()
      .catch((err) => logger.error("Error disconnecting Prisma", { message: String(err) }))
      .finally(() => {
        logger.info("Server closed");
        process.exit(0);
      });
  });
  // Don't hang forever waiting for in-flight requests.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { message: err.message, stack: err.stack });
  process.exit(1);
});
