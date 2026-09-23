import type { AdminJwtPayload } from "./admin.types";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export {};
