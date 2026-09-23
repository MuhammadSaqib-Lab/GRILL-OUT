import { z } from "zod";

// ---- Auth -------------------------------------------------------------------

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ---- Shared pagination --------------------------------------------------------

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ---- Orders -------------------------------------------------------------------

const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
]);

export const adminOrderListQuerySchema = paginationQuerySchema.extend({
  status: orderStatusEnum.optional(),
  orderType: z.enum(["pickup", "delivery"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminUpdateOrderStatusSchema = z.object({ status: orderStatusEnum });

// ---- Reservations ---------------------------------------------------------------

const reservationStatusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

export const adminReservationListQuerySchema = paginationQuerySchema.extend({
  status: reservationStatusEnum.optional(),
  when: z.enum(["today", "upcoming"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminUpdateReservationStatusSchema = z.object({ status: reservationStatusEnum });

// ---- Customers ------------------------------------------------------------------

export const adminCustomerListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
});

// ---- Menu: categories -------------------------------------------------------------

export const adminCreateCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  image: z.string().trim().url("Image must be a valid URL").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const adminUpdateCategorySchema = adminCreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ---- Menu: items --------------------------------------------------------------------

const menuOptionSchema = z.object({
  label: z.string().trim().min(1).max(60),
  price: z.number().positive("Option price must be greater than 0"),
});

export const adminCreateMenuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(1000),
  price: z.number().positive("Price must be greater than 0"),
  image: z.string().trim().url("Image must be a valid URL"),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  options: z.array(menuOptionSchema).max(20).optional(),
});

export const adminUpdateMenuItemSchema = z
  .object({
    categoryId: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    price: z.number().positive("Price must be greater than 0").optional(),
    image: z.string().trim().url("Image must be a valid URL").optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    options: z.array(menuOptionSchema).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
