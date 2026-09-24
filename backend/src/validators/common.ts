import { z } from "zod";

const HAS_MARKUP_OR_CONTROL_CHARS = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Free text typed by a customer (name, address, notes). Angle brackets and
 * control characters are rejected outright: none of these fields legitimately
 * contain HTML, and refusing it at the door means markup never reaches the
 * database. (The admin UI also HTML-escapes everything it renders — this is
 * defense in depth, not the only line of defense.) */
export function safeText(min: number, max: number, minMessage?: string) {
  return z
    .string()
    .trim()
    .min(min, minMessage)
    .max(max)
    .refine((v) => !HAS_MARKUP_OR_CONTROL_CHARS.test(v), "The characters < and > are not allowed");
}

/** Only http(s) URLs — z.string().url() alone also accepts javascript:, data:, etc. */
export const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url("Must be a valid URL")
  .refine((v) => /^https?:\/\//i.test(v), "URL must start with http:// or https://");

/** Postgres INT4 ceiling — larger ids would make the query throw. */
export const MAX_INT4 = 2_147_483_647;
