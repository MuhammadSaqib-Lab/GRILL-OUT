import type { AdminJwtPayload } from "./admin.types";
import type { AuthenticatedCustomer } from "./customer.types";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
      customer?: AuthenticatedCustomer;
    }
  }
}

export {};
