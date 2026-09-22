/**
 * Menu domain types. This is the contract the repository layer promises —
 * Phase 1 backs it with an in-memory array (see repositories/menu.repository.ts),
 * Phase 2 backs it with a real database table. Nothing outside the
 * repository should need to change when that swap happens.
 */

export interface MenuItemOption {
  label: string;
  price: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  /** Base price in PKR. For items with `options`, this is the lowest option price. */
  price: number;
  category: string;
  image: string;
  available: boolean;
  featured: boolean;
  tags: string[];
  /** Present only for items with size/variant pricing (pizza sizes, steak chicken/beef, etc.). */
  options?: MenuItemOption[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  key: string;
  label: string;
}
