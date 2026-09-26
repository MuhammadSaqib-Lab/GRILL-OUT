// Idempotent seed: safe to run with `npm run db:seed` any number of times.
// Every write is an upsert keyed on a stable identifier (category slug,
// menu item id, or the (menuItemId, label) pair for options) — re-running
// this never creates a duplicate row, it just re-syncs existing ones.
//
// Source of truth: src/data/menu.data.ts, which is itself a generated,
// verbatim port of the frontend's own IMG bank + MENU_ITEMS + CATEGORIES
// (see backend/scripts/generate-menu-data.js). Nothing here invents a
// name, price, description, or image — it only reshapes that already-
// verified data into rows.

import { PrismaClient } from "@prisma/client";
import { CATEGORIES, MENU_ITEMS } from "../src/data/menu.data";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // The seed resets every menu item/category back to the source data
  // (it never touches admin accounts). Fine for a fresh database; destructive on a
  // live one where the owner has been editing prices and images.
  if (env.isProduction && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error(
      "Refusing to seed in production: it would overwrite admin-edited menu data. Set ALLOW_PRODUCTION_SEED=true only for the very first deploy."
    );
  }

  console.log(`Seeding ${CATEGORIES.length} categories and ${MENU_ITEMS.length} menu items...`);

  const categoryIdBySlug = new Map<string, number>();

  for (const [index, category] of CATEGORIES.entries()) {
    const row = await prisma.menuCategory.upsert({
      where: { slug: category.key },
      create: {
        slug: category.key,
        name: category.label,
        sortOrder: index,
        isActive: true,
      },
      update: {
        name: category.label,
        sortOrder: index,
        isActive: true,
      },
    });
    categoryIdBySlug.set(category.key, row.id);
  }

  const usedSlugs = new Set<string>();

  for (const [index, item] of MENU_ITEMS.entries()) {
    const categoryId = categoryIdBySlug.get(item.category);
    if (!categoryId) {
      throw new Error(`Menu item "${item.name}" references unknown category "${item.category}"`);
    }

    // Names are unique in the source data today, but guard against it
    // anyway rather than let a future menu addition crash the seed.
    let slug = slugify(item.name);
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(item.name)}-${suffix++}`;
    }
    usedSlugs.add(slug);

    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        categoryId,
        name: item.name,
        slug,
        description: item.description,
        price: item.price,
        image: item.image,
        isAvailable: item.available,
        isFeatured: item.featured,
        tags: item.tags,
        sortOrder: index,
      },
      update: {
        categoryId,
        name: item.name,
        slug,
        description: item.description,
        price: item.price,
        image: item.image,
        isAvailable: item.available,
        isFeatured: item.featured,
        tags: item.tags,
        sortOrder: index,
      },
    });

    if (item.options) {
      const currentLabels = item.options.map((o) => o.label);

      for (const [optionIndex, option] of item.options.entries()) {
        await prisma.menuItemOption.upsert({
          where: { menuItemId_label: { menuItemId: item.id, label: option.label } },
          create: {
            menuItemId: item.id,
            label: option.label,
            price: option.price,
            sortOrder: optionIndex,
          },
          update: {
            price: option.price,
            sortOrder: optionIndex,
          },
        });
      }

      // Drop options that no longer exist in the source data (keeps re-seeds
      // clean if a size/variant is ever removed from the frontend's menu).
      await prisma.menuItemOption.deleteMany({
        where: { menuItemId: item.id, label: { notIn: currentLabels } },
      });
    }
  }

  // Explicit ids were inserted above (to match the frontend's hardcoded
  // 1-99 item ids) — bump the sequences so future plain `create()` calls
  // (e.g. from the admin dashboard, later) don't collide with them.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('menu_items', 'id'), COALESCE((SELECT MAX(id) FROM menu_items), 1))`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('menu_categories', 'id'), COALESCE((SELECT MAX(id) FROM menu_categories), 1))`
  );

  const categoryCount = await prisma.menuCategory.count();
  const itemCount = await prisma.menuItem.count();
  const optionCount = await prisma.menuItemOption.count();
  console.log(`Done. ${categoryCount} categories, ${itemCount} menu items, ${optionCount} options in the database.`);

  // Note: this seed deliberately does NOT create an admin account. The admin's
  // email/password are supplied by the operator via `npm run admin:setup`
  // (see DEPLOYMENT.md) — no credential lives in this file or in git.
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
