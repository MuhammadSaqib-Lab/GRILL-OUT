import { z } from "zod";

// Loose but real: 7-20 digits, optional leading +, spaces/dashes allowed —
// covers local (0300-1234567) and international formats without being
// country-specific enough to reject legitimate numbers.
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

const orderLineSchema = z.object({
  menuItemId: z.number().int().positive(),
  optionLabel: z.string().trim().min(1).max(60).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Quantity is too high"),
});

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Name is too short").max(100),
    phone: phoneSchema,
    email: z.string().trim().email("Enter a valid email").max(150).optional(),
    items: z.array(orderLineSchema).min(1, "Order must contain at least one item").max(50),
    orderType: z.enum(["pickup", "delivery"]),
    deliveryAddress: z.string().trim().min(5).max(300).optional(),
    specialInstructions: z.string().trim().max(500).optional(),
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

export const orderIdParamSchema = z.object({
  id: z.string().trim().min(1),
});
