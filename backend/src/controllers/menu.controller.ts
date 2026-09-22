import type { Request, Response } from "express";
import { menuService } from "../services/menu.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const menuController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { available, featured } = req.query as unknown as { available?: boolean; featured?: boolean };
    const items = await menuService.listItems({ available, featured });
    sendSuccess(res, items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: number };
    const item = await menuService.getItemById(id);
    sendSuccess(res, item);
  }),

  listByCategory: asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params as unknown as { category: string };
    const items = await menuService.listByCategory(category);
    sendSuccess(res, items);
  }),

  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await menuService.listCategories();
    sendSuccess(res, categories);
  }),
};
