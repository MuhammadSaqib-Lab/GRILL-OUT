import { randomUUID } from "crypto";
import type { Reservation } from "../types/reservation.types";

export interface ReservationRepository {
  create(reservation: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | undefined>;
  update(reservation: Reservation): Promise<Reservation>;
  nextId(): string;
}

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>();

  nextId(): string {
    return `RES-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  async create(reservation: Reservation): Promise<Reservation> {
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async findById(id: string): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async update(reservation: Reservation): Promise<Reservation> {
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }
}

export const reservationRepository: ReservationRepository = new InMemoryReservationRepository();
