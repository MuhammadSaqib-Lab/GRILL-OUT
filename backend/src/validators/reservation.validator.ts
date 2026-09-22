import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

// Matches <input type="date"> value format exactly (index.html #reservation-date).
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date")
  .refine((value) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(value) >= today;
  }, "Reservation date cannot be in the past");

// Matches <input type="time"> value format exactly (index.html #res-time).
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM 24h format");

export const createReservationSchema = z.object({
  customerName: z.string().trim().min(2, "Name is too short").max(100),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email").max(150).optional(),
  date: dateSchema,
  time: timeSchema,
  // Same option values as <select id="res-guests"> in index.html.
  guests: z.enum(["1-2", "3-4", "5-6", "7+"]),
  specialRequests: z.string().trim().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const reservationIdParamSchema = z.object({
  id: z.string().trim().min(1),
});
