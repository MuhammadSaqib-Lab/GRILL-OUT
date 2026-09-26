import { z } from "zod";
import { MAX_INT4, httpUrl } from "./common";

// ---- Auth -------------------------------------------------------------------

export const adminLoginSchema = z.object({
  // Lower-cased so login is case-insensitive (setup stores the address lower-cased).
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  // bcrypt only uses the first 72 bytes; capping length also stops huge
  // bodies being used to burn CPU in the hash comparison.
  password: z.string().min(1, "Password is required").max(128),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ---- Shared pagination --------------------------------------------------------

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(100_000).default(1),
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

// The message is free text written by an admin and is shown to the customer.
// It is stored verbatim and always rendered as plain text (never HTML), so
// characters like < > are allowed. NUL is not: Postgres text can't hold it.
// Blank / whitespace-only / null / omitted all mean "no message".
export const ORDER_MESSAGE_MAX_LENGTH = 500;

export const adminStatusMessage = z
  .string({ invalid_type_error: "Message must be text" })
  .trim()
  .max(ORDER_MESSAGE_MAX_LENGTH, `Message must be ${ORDER_MESSAGE_MAX_LENGTH} characters or fewer`)
  .refine((v) => !v.includes("\u0000"), "Message contains invalid characters")
  .transform((v) => (v === "" ? null : v))
  .nullish()
  .transform((v) => v ?? null);

export const adminUpdateOrderStatusSchema = z.object({
  status: orderStatusEnum,
  message: adminStatusMessage,
});

// ---- Reservations ---------------------------------------------------------------

const reservationStatusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

export const adminReservationListQuerySchema = paginationQuerySchema.extend({
  status: reservationStatusEnum.optional(),
  when: z.enum(["today", "upcoming"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminUpdateReservationStatusSchema = z.object({
  status: reservationStatusEnum,
  message: adminStatusMessage,
});

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
  image: httpUrl.optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

export const adminUpdateCategorySchema = adminCreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ---- Menu: items --------------------------------------------------------------------

const menuOptionSchema = z.object({
  label: z.string().trim().min(1).max(60),
  price: z.number().positive("Option price must be greater than 0").max(1_000_000),
});

export const adminCreateMenuItemSchema = z.object({
  categoryId: z.number().int().positive().max(MAX_INT4),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(1000),
  price: z.number().positive("Price must be greater than 0").max(1_000_000),
  image: httpUrl,
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
  options: z.array(menuOptionSchema).max(20).optional(),
});

export const adminUpdateMenuItemSchema = z
  .object({
    categoryId: z.number().int().positive().max(MAX_INT4).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    price: z.number().positive("Price must be greater than 0").max(1_000_000).optional(),
    image: httpUrl.optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    options: z.array(menuOptionSchema).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

// Capped at Postgres' INT4 max — a larger value would make the query itself
// throw instead of simply finding nothing.
// Digits only: z.coerce.number() alone would also accept "1e3", "0x10" or " 5 ".
// Customer ids are cuids: lower-case letters and digits only.
export const customerIdParamSchema = z.object({ id: z.string().regex(/^[a-z0-9]{20,32}$/, "Invalid customer id") });

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9]{1,10}$/, "Invalid id")
    .transform(Number)
    .pipe(z.number().int().positive().max(MAX_INT4)),
});
