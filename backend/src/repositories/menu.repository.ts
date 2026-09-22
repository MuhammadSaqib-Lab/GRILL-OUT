import { CATEGORIES, MENU_ITEMS } from "../data/menu.data";
import type { Category, MenuItem } from "../types/menu.types";

/**
 * Repository contract for menu data. Phase 1 implements this over the
 * static, frontend-derived array in data/menu.data.ts. Phase 2 swaps in an
 * implementation backed by a real table/ORM — the interface (and therefore
 * every service/controller that depends on it) does not change.
 */
export interface MenuRepository {
  findAll(): Promise<MenuItem[]>;
  findById(id: number): Promise<MenuItem | undefined>;
  findByCategory(category: string): Promise<MenuItem[]>;
  listCategories(): Promise<Category[]>;
}

export class InMemoryMenuRepository implements MenuRepository {
  // Cloned so callers can never mutate the seed data by mutating a returned array/object.
  private readonly items: MenuItem[] = MENU_ITEMS.map((item) => ({ ...item }));
  private readonly categories: Category[] = CATEGORIES.map((c) => ({ ...c }));

  async findAll(): Promise<MenuItem[]> {
    return [...this.items];
  }

  async findById(id: number): Promise<MenuItem | undefined> {
    return this.items.find((item) => item.id === id);
  }

  async findByCategory(category: string): Promise<MenuItem[]> {
    return this.items.filter((item) => item.category === category);
  }

  async listCategories(): Promise<Category[]> {
    return [...this.categories];
  }
}

export const menuRepository: MenuRepository = new InMemoryMenuRepository();
