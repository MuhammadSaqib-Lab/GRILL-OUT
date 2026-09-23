import { randomUUID } from "crypto";
import type { Reservation as PrismaReservation } from "@prisma/client";
import { prisma } from "../config/prisma";
import type { GuestBand, Reservation, ReservationStatus } from "../types/reservation.types";

export interface CreateReservationData {
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
  updateStatus(id: string, status: ReservationStatus): Promise<Reservation>;
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
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaReservationRepository implements ReservationRepository {
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const id = `RES-${randomUUID().slice(0, 8).toUpperCase()}`;

    const created = await prisma.$transaction(async (tx) => {
      // Same guest-friendly upsert-by-phone as orders — no account required.
      const customer = await tx.customer.upsert({
        where: { phone: data.phone },
        create: { name: data.customerName, phone: data.phone, email: data.email },
        update: { name: data.customerName, ...(data.email ? { email: data.email } : {}) },
      });

      return tx.reservation.create({
        data: {
          id,
          customerId: customer.id,
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
    });

    return toDomainReservation(created);
  }

  async findById(id: string): Promise<Reservation | undefined> {
    const row = await prisma.reservation.findUnique({ where: { id } });
    return row ? toDomainReservation(row) : undefined;
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const row = await prisma.reservation.update({ where: { id }, data: { status } });
    return toDomainReservation(row);
  }
}

export const reservationRepository: ReservationRepository = new PrismaReservationRepository();
