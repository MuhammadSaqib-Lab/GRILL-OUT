import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { categoryRouter } from "./category.routes";
import { customerAccountRouter } from "./customerAccount.routes";
import { customerAuthRouter } from "./customerAuth.routes";
import { healthRouter } from "./health.routes";
import { menuRouter } from "./menu.routes";
import { orderRouter } from "./order.routes";
import { reservationRouter } from "./reservation.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/menu", menuRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/reservations", reservationRouter);
apiRouter.use("/auth/customer", customerAuthRouter);
apiRouter.use("/customer", customerAccountRouter);
apiRouter.use("/admin", adminRouter);
