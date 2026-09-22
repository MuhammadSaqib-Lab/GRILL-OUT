import { Router } from "express";
import { menuController } from "../controllers/menu.controller";

export const categoryRouter = Router();

categoryRouter.get("/", menuController.listCategories);
