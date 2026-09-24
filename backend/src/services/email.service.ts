import nodemailer from "nodemailer";
import { env } from "../config/env";
import type { Order, OrderStatus } from "../types/order.types";
import type { Reservation, ReservationStatus } from "../types/reservation.types";
import { logger } from "../utils/logger";

/**
 * Transactional email.
 *
 *  - SMTP_HOST set  -> sent through SMTP (nodemailer).
 *  - SMTP_HOST unset -> nothing leaves the machine; a one-line "would send"
 *    entry is logged (masked recipient + subject only, never the body).
 *  - NODE_ENV=test   -> messages are captured in an in-memory outbox.
 *
 * Sending is always fire-and-forget from the caller's side and any failure is
 * logged, never thrown: an order or reservation is already saved by the time
 * we get here and must not be reported as failed because a mail server hiccuped.
 *
 * Every customer-supplied value (names, addresses, notes, admin messages) is
 * HTML-escaped in the HTML body; the plain-text body carries the raw text.
 */

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const testOutbox: MailMessage[] = [];
export const mailOutbox = {
  all: (): readonly MailMessage[] => testOutbox,
  clear: () => {
    testOutbox.length = 0;
  },
};

const smtp = !env.isTest && env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } } : {}),
    })
  : null;

function maskEmail(address: string): string {
  const [user = "", domain = ""] = address.split("@");
  return `${user.slice(0, 1)}***@${domain}`;
}

async function deliver(message: MailMessage): Promise<void> {
  if (env.isTest) {
    testOutbox.push(message); // synchronous on purpose: tests read the outbox right after the request
    return;
  }
  if (!smtp) {
    logger.info(`Email not sent (SMTP not configured): to=${maskEmail(message.to)} subject="${message.subject}"`);
    return;
  }
  await smtp.sendMail({ from: env.MAIL_FROM, to: message.to, subject: message.subject, text: message.text, html: message.html });
}

function send(message: MailMessage): void {
  deliver(message).catch((err) => {
    logger.error("Email delivery failed", {
      to: maskEmail(message.to),
      subject: message.subject,
      message: err instanceof Error ? err.message : String(err),
    });
  });
}

// ---- formatting helpers --------------------------------------------------------

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] as string);

const money = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Received",
  CONFIRMED: "Confirmed",
  PREPARING: "Being prepared",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "Received",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const adminRecipient = () => env.ADMIN_NOTIFY_EMAIL ?? env.ADMIN_EMAIL;

function layout(heading: string, rows: Array<[string, string]>, footer?: string): { html: string; text: string } {
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#111;white-space:pre-line">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111">` +
    `<h2 style="margin:0 0 16px;color:#cc5500">${escapeHtml(heading)}</h2>` +
    `<table style="border-collapse:collapse;font-size:14px">${htmlRows}</table>` +
    (footer ? `<p style="margin-top:20px;font-size:13px;color:#555">${escapeHtml(footer)}</p>` : "") +
    `<p style="margin-top:24px;font-size:12px;color:#999">Grill Out — GT Road, Haripur</p></div>`;
  const text = [heading, "", ...rows.map(([l, v]) => `${l}: ${v}`), ...(footer ? ["", footer] : []), "", "Grill Out — GT Road, Haripur"].join("\n");
  return { html, text };
}

const orderItemLines = (order: Order) =>
  order.items
    .map((i) => `${i.quantity} x ${i.name}${i.optionLabel ? ` (${i.optionLabel})` : ""} — ${money(i.subtotal)}`)
    .join("\n");

// ---- public API ---------------------------------------------------------------

export const emailService = {
  /** Alert to the restaurant: a new order has arrived. */
  notifyNewOrder(order: Order): void {
    const { html, text } = layout(`New order ${order.id}`, [
      ["Customer", order.customerName],
      ["Customer email", order.email ?? "—"],
      ["Phone", order.phone],
      ["Order number", order.id],
      ["Type", order.orderType === "delivery" ? "Delivery" : "Pickup"],
      ...(order.deliveryAddress ? ([["Address", order.deliveryAddress]] as Array<[string, string]>) : []),
      ["Items", orderItemLines(order)],
      ["Subtotal", money(order.subtotal)],
      ["Delivery fee", money(order.deliveryFee)],
      ["Total", money(order.total)],
      ...(order.specialInstructions ? ([["Notes", order.specialInstructions]] as Array<[string, string]>) : []),
    ]);
    send({ to: adminRecipient(), subject: `New order ${order.id} — ${money(order.total)}`, text, html });
  },

  /** Alert to the restaurant: a new table reservation. */
  notifyNewReservation(reservation: Reservation): void {
    const { html, text } = layout(`New table reservation ${reservation.id}`, [
      ["Customer", reservation.customerName],
      ["Customer email", reservation.email ?? "—"],
      ["Phone", reservation.phone],
      ["Reservation number", reservation.id],
      ["Date", reservation.date],
      ["Time", reservation.time],
      ["Guests", reservation.guests],
      ...(reservation.specialRequests ? ([["Special requests", reservation.specialRequests]] as Array<[string, string]>) : []),
    ]);
    send({
      to: adminRecipient(),
      subject: `New reservation ${reservation.id} — ${reservation.date} ${reservation.time}`,
      text,
      html,
    });
  },

  /** Email to the customer after an admin changes an order's status. Sent for
   * confirmations and cancellations, and for any other change where the admin
   * wrote a message (they clearly want the customer to read it). */
  notifyOrderStatus(order: Order): void {
    if (!order.email) return;
    const important = order.status === "CONFIRMED" || order.status === "CANCELLED";
    if (!important && !order.adminMessage) return;

    const label = ORDER_STATUS_LABEL[order.status];
    const subject =
      order.status === "CONFIRMED"
        ? "Your Grill Out Order Has Been Confirmed"
        : order.status === "CANCELLED"
          ? "Your Grill Out Order Has Been Cancelled"
          : `Update on your Grill Out order ${order.id}: ${label}`;
    const { html, text } = layout(subject, [
      ["Order number", order.id],
      ["Status", label],
      ["Order summary", orderItemLines(order)],
      ["Total", money(order.total)],
      // Only when the admin actually wrote one — never a made-up reason.
      ...(order.adminMessage ? ([["Message from Grill Out", order.adminMessage]] as Array<[string, string]>) : []),
    ]);
    send({ to: order.email, subject, text, html });
  },

  /** Email to the customer after an admin changes a reservation's status. */
  notifyReservationStatus(reservation: Reservation): void {
    if (!reservation.email) return;
    const important = reservation.status === "CONFIRMED" || reservation.status === "CANCELLED";
    if (!important && !reservation.adminMessage) return;

    const label = RESERVATION_STATUS_LABEL[reservation.status];
    const subject =
      reservation.status === "CONFIRMED"
        ? "Your Grill Out Table Reservation Is Confirmed"
        : reservation.status === "CANCELLED"
          ? "Your Grill Out Table Reservation Has Been Cancelled"
          : `Update on your Grill Out reservation ${reservation.id}: ${label}`;
    const { html, text } = layout(subject, [
      ["Reservation number", reservation.id],
      ["Status", label],
      ["Date", reservation.date],
      ["Time", reservation.time],
      ["Guests", reservation.guests],
      ...(reservation.adminMessage ? ([["Message from Grill Out", reservation.adminMessage]] as Array<[string, string]>) : []),
    ]);
    send({ to: reservation.email, subject, text, html });
  },
};
