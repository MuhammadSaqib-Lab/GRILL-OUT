import { randomUUID } from "crypto";
import type { Reservation as PrismaReservation } from "@prisma/client";
import { prisma } from "../config/prisma";
import type { GuestBand, Reservation, ReservationStatus } from "../types/reservation.types";

export interface CreateReservationData {
  /** The logged-in account this reservation belongs to (from the session, never the client). */
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: GuestBand;
  specialRequests?: string;
}

export interface ReservationRepository {
  createReservation(data: CreateReservationData): Promise<Reservation>;
  findById(id: string): Promise<Reservation | undefined>;
  /** Scoped by owner: someone else's reservation is indistinguishable from a missing one. */
  findByIdForCustomer(id: string, customerId: string): Promise<Reservation | undefined>;
  listByCustomer(customerId: string): Promise<Reservation[]>;
  /** `adminMessage` replaces any previous message; null/undefined clears it. */
  updateStatus(id: string, status: ReservationStatus, adminMessage?: string | null): Promise<Reservation>;
}

function toDomainReservation(row: PrismaReservation): Reservation {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    ...(row.email ? { email: row.email } : {}),
    date: row.date,
    time: row.time,
    guests: row.guests as GuestBand,
    ...(row.specialRequests ? { specialRequests: row.specialRequests } : {}),
    ...(row.adminMessage ? { adminMessage: row.adminMessage } : {}),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaReservationRepository implements ReservationRepository {
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const id = `RES-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    const created = await prisma.reservation.create({
      data: {
        id,
        customerId: data.customerId,
        customerName: data.customerName,
        phone: data.phone,
        email: data.email,
        date: data.date,
        time: data.time,
        guests: data.guests,
        specialRequests: data.specialRequests,
        status: "PENDING",
      },
    });

    return toDomainReservation(created);
  }

  async findById(id: string): Promise<Reservation | undefined> {
    const row = await prisma.reservation.findUnique({ where: { id } });
    return row ? toDomainReservation(row) : undefined;
  }

  async findByIdForCustomer(id: string, customerId: string): Promise<Reservation | undefined> {
    const row = await prisma.reservation.findFirst({ where: { id, customerId } });
    return row ? toDomainReservation(row) : undefined;
  }

  async listByCustomer(customerId: string): Promise<Reservation[]> {
    const rows = await prisma.reservation.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(toDomainReservation);
  }

  async updateStatus(id: string, status: ReservationStatus, adminMessage?: string | null): Promise<Reservation> {
    const row = await prisma.reservation.update({ where: { id }, data: { status, adminMessage: adminMessage ?? null } });
    return toDomainReservation(row);
  }
}

export const reservationRepository: ReservationRepository = new PrismaReservationRepository();
