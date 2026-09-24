import { z } from "zod";
import { MAX_INT4, safeText } from "./common";

// Loose but real: 7-20 digits, optional leading +, spaces/dashes allowed —
// covers local (0300-1234567) and international formats without being
// country-specific enough to reject legitimate numbers.
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

const orderLineSchema = z.object({
  menuItemId: z.number().int().positive().max(MAX_INT4),
  optionLabel: safeText(1, 60).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Quantity is too high"),
});

export const createOrderSchema = z
  .object({
    // Name and email are NOT accepted from the client any more: the order
    // takes them from the logged-in account (unknown keys are stripped).
    phone: phoneSchema,
    items: z.array(orderLineSchema).min(1, "Order must contain at least one item").max(50),
    orderType: z.enum(["pickup", "delivery"]),
    deliveryAddress: safeText(5, 300).optional(),
    specialInstructions: safeText(0, 500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === "delivery" && !data.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Delivery address is required for delivery orders",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Ids are generated as ORD-XXXXXXXXXXXX — anything else can't exist, so reject
// it before it ever reaches the database.
export const orderIdParamSchema = z.object({
  id: z.string().trim().regex(/^ORD-[A-Z0-9]{8,16}$/, "Invalid order id"),
});
