export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

/** Matches the frontend's <select id="res-guests"> option values exactly
 * (index.html) so the existing form needs no redesign to talk to this API. */
export type GuestBand = "1-2" | "3-4" | "5-6" | "7+";

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  /** ISO date, e.g. "2026-09-25" */
  date: string;
  /** 24h time, e.g. "19:00" */
  time: string;
  guests: GuestBand;
  specialRequests?: string;
  /** Optional note from the restaurant, tied to the current status. */
  adminMessage?: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}
