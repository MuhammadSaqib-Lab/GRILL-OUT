import { z } from "zod";
import { restaurantNowTime, restaurantToday } from "../utils/restaurantTime";
import { safeText } from "./common";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

// Matches <input type="date"> value format exactly (index.html #reservation-date).
// "Today" is the restaurant's today (RESTAURANT_TIMEZONE), compared as plain
// YYYY-MM-DD strings — no server-timezone or Date-parsing surprises.
const dateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    // A real calendar day: JS would happily turn 2026-02-31 into March 3rd.
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, "Invalid date")
  .refine((value) => value >= restaurantToday(), "Reservation date cannot be in the past");

// Matches <input type="time"> value format exactly (index.html #res-time).
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM 24h format");

export const createReservationSchema = z
  .object({
    // Name and email come from the logged-in account, not the request body.
    phone: phoneSchema,
    date: dateSchema,
    time: timeSchema,
    // Same option values as <select id="res-guests"> in index.html.
    guests: z.enum(["1-2", "3-4", "5-6", "7+"]),
    specialRequests: safeText(0, 500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.date === restaurantToday() && data.time <= restaurantNowTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["time"], message: "That time has already passed today" });
    }
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const reservationIdParamSchema = z.object({
  id: z.string().trim().regex(/^RES-[A-Z0-9]{8,16}$/, "Invalid reservation id"),
});
