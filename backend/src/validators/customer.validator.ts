import { z } from "zod";
import { safeText } from "./common";

// Emails are stored lower-cased so "Jane@X.com" and "jane@x.com" are one account.
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

// bcrypt only reads the first 72 bytes and very long inputs are a CPU-burn
// vector, so the upper bound is deliberate.
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer")
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "Password must contain at least one letter and one number");

export const customerSignupSchema = z
  .object({
    name: safeText(2, 100, "Please enter your full name"),
    email,
    password: newPassword,
    confirmPassword: z.string().max(128).optional(),
  })
  .refine((v) => v.confirmPassword === undefined || v.confirmPassword === v.password, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  // Strip to exactly the fields we accept — a client can't smuggle in
  // passwordHash, sessionVersion, loginEmail, id, etc. (mass assignment).
  .transform(({ name, email: e, password }) => ({ name, email: e, password }));

export const customerLoginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
