import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptionsDelegate } from "./config/cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRouter } from "./routes";
import { logger } from "./utils/logger";

const ADMIN_UI_DIR = path.join(__dirname, "..", "admin-ui");

// Private/personal responses must never sit in a shared or browser cache.
function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  next();
}

// The API and admin dashboard are not search content. The <meta robots> tag
// on each admin page is belt; this header is braces (it also covers JSON).
function noIndex(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  next();
}

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  // Behind a reverse proxy/load balancer, req.ip (used by every rate limiter)
  // is the proxy's address unless Express is told how many hops to trust.
  // 0 = not behind a proxy. Never set this higher than the real hop count:
  // extra trusted hops let clients spoof X-Forwarded-For and dodge rate limits.
  if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);

  // Helmet's default CSP is already strict (script-src 'self', no inline
  // scripts/handlers, object-src 'none', frame-ancestors 'self', ...). The
  // admin UI is built to comply with it — external scripts + a compiled
  // stylesheet, no CDN — so nothing here needs loosening. Only fonts/images
  // need the extra origins below.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          "img-src": ["'self'", "data:", "https:"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          "form-action": ["'self'"],
        },
      },
      referrerPolicy: { policy: "no-referrer" },
      crossOriginResourcePolicy: { policy: "same-site" },
      strictTransportSecurity: env.isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
        : false,
    })
  );
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
    );
    next();
  });

  app.use(cors(corsOptionsDelegate));
  app.use(cookieParser());

  // 10kb is generous for the JSON this API ever receives (a cart's worth of
  // order lines, a reservation form) and cheap insurance against oversized bodies.
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  if (!env.isTest) {
    // Log the path only — never the query string, which on admin searches can
    // contain a customer's phone number.
    morgan.token("safe-path", (req) => (req as Request).path);
    app.use(
      morgan(":remote-addr :method :safe-path :status :res[content-length] - :response-time ms", {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  app.use("/api", noIndex);
  app.use("/api/admin", noStore);
  app.use("/api/auth", noStore);
  app.use("/api/customer", noStore);
  app.use("/api/orders", noStore);
  app.use("/api/reservations", noStore);
  app.use("/api", apiRouter);

  // Admin dashboard static assets (login/dashboard/orders/... HTML+JS+CSS).
  // Serving these costs nothing security-wise: the pages themselves carry
  // no data, and every fetch they make against /api/admin/* is checked by
  // requireAdmin server-side regardless of whether the page was "hidden."
  app.use("/admin", noIndex, noStore, express.static(ADMIN_UI_DIR, { index: "login.html" }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
