import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptionsDelegate } from "./config/cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRouter } from "./routes";
import { logger } from "./utils/logger";

const ADMIN_UI_DIR = path.join(__dirname, "..", "admin-ui");

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      // The admin UI (served by this same app, see below) follows the
      // public site's own established pattern: Tailwind's Play CDN plus
      // plain inline <script> tags, no bundler. Helmet's strict default
      // CSP would block both outright, so it's relaxed just enough for
      // that — everything else Helmet sets (HSTS, X-Frame-Options,
      // X-Content-Type-Options, etc.) stays at its default.
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'", "https:"],
          "img-src": ["'self'", "data:", "https:"],
          "connect-src": ["'self'"],
        },
      },
    })
  );
  app.use(cors(corsOptionsDelegate));
  app.use(cookieParser());

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

  // Admin dashboard static assets (login/dashboard/orders/... HTML+JS+CSS).
  // Serving these costs nothing security-wise: the pages themselves carry
  // no data, and every fetch they make against /api/admin/* is checked by
  // requireAdmin server-side regardless of whether the page was "hidden."
  app.use("/admin", express.static(ADMIN_UI_DIR));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
