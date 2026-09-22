import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { validateRequest } from "../middleware/validateRequest";
import { categoryParamSchema, menuIdParamSchema, menuQuerySchema } from "../validators/menu.validator";

export const menuRouter = Router();

menuRouter.get("/", validateRequest({ query: menuQuerySchema }), menuController.list);
menuRouter.get(
  "/category/:category",
  validateRequest({ params: categoryParamSchema }),
  menuController.listByCategory
);
menuRouter.get("/:id", validateRequest({ params: menuIdParamSchema }), menuController.getById);
