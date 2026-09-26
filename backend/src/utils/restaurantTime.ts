import { env } from "../config/env";

/**
 * "Today", "this week" and "the current time" mean the RESTAURANT's calendar
 * (Haripur, Pakistan by default), not the server's. A hosted server usually
 * runs in UTC, five hours behind — which would make the dashboard's "today"
 * flip at 5 AM local time and reject same-day reservations made after
 * midnight (the restaurant is open until 1 AM). All date maths goes through here.
 */

const zone = () => env.RESTAURANT_TIMEZONE;

function parts(date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-CA", {
    timeZone: zone(),
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

/** Restaurant-local date as YYYY-MM-DD. */
export function restaurantToday(now: Date = new Date()): string {
  const p = parts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Restaurant-local time as HH:MM (24h). */
export function restaurantNowTime(now: Date = new Date()): string {
  const p = parts(now);
  return `${p.hour}:${p.minute}`;
}

/** How far the restaurant zone is ahead of UTC at this instant, in ms. */
function offsetMs(at: Date): number {
  const p = parts(at);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant the given restaurant-local calendar day begins. */
function startOfLocalDay(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day));
  return new Date(guess.getTime() - offsetMs(guess));
}

export function restaurantStartOfDay(now: Date = new Date()): Date {
  const p = parts(now);
  return startOfLocalDay(Number(p.year), Number(p.month), Number(p.day));
}

/** Weeks start on Sunday, as the dashboard has always defined them. */
export function restaurantStartOfWeek(now: Date = new Date()): Date {
  const p = parts(now);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday as string);
  return startOfLocalDay(Number(p.year), Number(p.month), Number(p.day) - weekday);
}

export function restaurantStartOfMonth(now: Date = new Date()): Date {
  const p = parts(now);
  return startOfLocalDay(Number(p.year), Number(p.month), 1);
}
