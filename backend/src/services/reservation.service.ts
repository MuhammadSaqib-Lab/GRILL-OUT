import { reservationRepository } from "../repositories/reservation.repository";
import type { Reservation, ReservationStatus } from "../types/reservation.types";
import type { CreateReservationInput } from "../validators/reservation.validator";
import { ApiError } from "../utils/ApiError";

const CANCELLABLE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED"];

export const reservationService = {
  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const now = new Date().toISOString();
    const reservation: Reservation = {
      id: reservationRepository.nextId(),
      customerName: input.customerName,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      date: input.date,
      time: input.time,
      guests: input.guests,
      ...(input.specialRequests ? { specialRequests: input.specialRequests } : {}),
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    return reservationRepository.create(reservation);
  },

  async getReservationById(id: string): Promise<Reservation> {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw ApiError.notFound(`Reservation ${id} was not found`);
    }
    return reservation;
  },

  async cancelReservation(id: string): Promise<Reservation> {
    const reservation = await this.getReservationById(id);
    if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
      throw ApiError.conflict(`Reservation ${id} is "${reservation.status}" and can no longer be cancelled`);
    }
    reservation.status = "CANCELLED";
    reservation.updatedAt = new Date().toISOString();
    return reservationRepository.update(reservation);
  },
};
