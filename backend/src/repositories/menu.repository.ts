import type { MenuItem as PrismaMenuItem, MenuItemOption as PrismaMenuItemOption, MenuCategory } from "@prisma/client";
import { prisma } from "../config/prisma";
import type { Category, MenuItem } from "../types/menu.types";

/**
 * Repository contract for menu data. Phase 1 implemented this over a static,
 * frontend-derived in-memory array. Phase 2 (this file) backs it with
 * PostgreSQL via Prisma — the interface, and therefore every service and
 * controller built on it, is unchanged.
 */
export interface MenuRepository {
  findAll(): Promise<MenuItem[]>;
  findById(id: number): Promise<MenuItem | undefined>;
  findByCategory(categorySlug: string): Promise<MenuItem[]>;
  listCategories(): Promise<Category[]>;
}

type PrismaMenuItemWithOptions = PrismaMenuItem & {
  options: PrismaMenuItemOption[];
  category: MenuCategory;
};

// Prisma returns Decimal for money columns and Date for timestamps; the
// domain type promises plain `number` / ISO `string` (see menu.types.ts),
// so every read maps through here rather than leaking Prisma's types
// upward through services/controllers/API responses.
function toDomainMenuItem(row: PrismaMenuItemWithOptions): MenuItem {
  const options = row.options
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({ label: o.label, price: Number(o.price) }));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category.slug,
    image: row.image,
    available: row.isAvailable,
    featured: row.isFeatured,
    tags: row.tags,
    ...(options.length > 0 ? { options } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const includeRelations = { options: true, category: true } as const;

export class PrismaMenuRepository implements MenuRepository {
  async findAll(): Promise<MenuItem[]> {
    // Items in a deactivated category are hidden with it. (Unavailable items
    // stay in the list, flagged available:false, so the site can show them as sold out.)
    const rows = await prisma.menuItem.findMany({
      where: { category: { isActive: true } },
      include: includeRelations,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });
    return rows.map(toDomainMenuItem);
  }

  async findById(id: number): Promise<MenuItem | undefined> {
    const row = await prisma.menuItem.findUnique({ where: { id }, include: includeRelations });
    return row ? toDomainMenuItem(row) : undefined;
  }

  async findByCategory(categorySlug: string): Promise<MenuItem[]> {
    const rows = await prisma.menuItem.findMany({
      where: { category: { slug: categorySlug, isActive: true } },
      include: includeRelations,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toDomainMenuItem);
  }

  async listCategories(): Promise<Category[]> {
    const rows = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((c) => ({ key: c.slug, label: c.name }));
  }
}

export const menuRepository: MenuRepository = new PrismaMenuRepository();
