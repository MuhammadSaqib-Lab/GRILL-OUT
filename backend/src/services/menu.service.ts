import { menuRepository } from "../repositories/menu.repository";
import type { Category, MenuItem } from "../types/menu.types";
import { ApiError } from "../utils/ApiError";

export interface MenuQueryFilters {
  available?: boolean;
  featured?: boolean;
}

function applyFilters(items: MenuItem[], filters: MenuQueryFilters): MenuItem[] {
  return items.filter((item) => {
    if (filters.available !== undefined && item.available !== filters.available) return false;
    if (filters.featured !== undefined && item.featured !== filters.featured) return false;
    return true;
  });
}

export const menuService = {
  async listItems(filters: MenuQueryFilters = {}): Promise<MenuItem[]> {
    const items = await menuRepository.findAll();
    return applyFilters(items, filters);
  },

  async getItemById(id: number): Promise<MenuItem> {
    const item = await menuRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Menu item ${id} was not found`);
    }
    return item;
  },

  async listByCategory(category: string): Promise<MenuItem[]> {
    const categories = await menuRepository.listCategories();
    const known = categories.some((c) => c.key === category);
    if (!known) {
      throw ApiError.notFound(`Category "${category}" was not found`);
    }
    return menuRepository.findByCategory(category);
  },

  async listCategories(): Promise<Category[]> {
    return menuRepository.listCategories();
  },
};
