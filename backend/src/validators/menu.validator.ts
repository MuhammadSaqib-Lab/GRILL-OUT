import { z } from "zod";

export const menuIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "id must be a positive integer" }),
});

export const categoryParamSchema = z.object({
  category: z.string().trim().min(1).max(50),
});

export const menuQuerySchema = z.object({
  available: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
