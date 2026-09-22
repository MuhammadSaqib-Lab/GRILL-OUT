// One-off generator: turns backend/src/data/extracted-menu.json (a verbatim
// dump of the frontend's own IMG bank + MENU_ITEMS + CATEGORIES, taken from
// js/script.js) into a typed TS data module. Run again only if the frontend
// menu changes — never hand-edit menu.data.ts, regenerate it.
//
//   node backend/scripts/generate-menu-data.js
//
const fs = require("fs");
const path = require("path");

const SOURCE = path.join(__dirname, "..", "src", "data", "extracted-menu.json");
const OUT = path.join(__dirname, "..", "src", "data", "menu.data.ts");

const { categories, menuItems } = JSON.parse(fs.readFileSync(SOURCE, "utf8"));

const SEED_TIMESTAMP = new Date().toISOString();

function basePrice(item) {
  if (item.price !== undefined) return item.price;
  return Math.min(...item.options.map((o) => o.price));
}

const items = menuItems.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.desc,
  price: basePrice(item),
  category: item.category,
  image: item.img,
  available: true,
  featured: item.badge === "chef",
  tags: item.badge === "spicy" ? ["spicy"] : [],
  ...(item.options ? { options: item.options } : {}),
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
}));

const categoryList = categories.filter((c) => c.key !== "all");

const banner = `// AUTO-GENERATED — do not hand-edit.
//
// Source of truth is the frontend itself: this file is a straight port of
// the IMG bank + MENU_ITEMS + CATEGORIES arrays in ../../../js/script.js,
// produced by backend/scripts/generate-menu-data.js. Names, prices,
// descriptions, images and categories are copied verbatim from the live
// frontend so this mock data layer can never drift from what the site
// actually shows.
//
// This is Phase-1 in-memory seed data (see repositories/menu.repository.ts).
// Phase 2 replaces the array underneath the repository with a real
// database table — the MenuItem shape below is the contract the rest of
// the backend (services, controllers, API responses) is written against,
// so that swap should not require touching anything outside the
// repository implementation.

import type { Category, MenuItem } from "../types/menu.types";

export const CATEGORIES: Category[] = ${JSON.stringify(categoryList, null, 2)};

export const MENU_ITEMS: MenuItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(OUT, banner);
console.log(`Wrote ${items.length} menu items and ${categoryList.length} categories to ${OUT}`);
