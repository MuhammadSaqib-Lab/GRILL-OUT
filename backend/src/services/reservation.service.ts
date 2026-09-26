import { reservationRepository } from "../repositories/reservation.repository";
import type { Reservation, ReservationStatus } from "../types/reservation.types";
import type { AuthenticatedCustomer } from "../types/customer.types";
import type { CreateReservationInput } from "../validators/reservation.validator";
import { ApiError } from "../utils/ApiError";

const CANCELLABLE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED"];

export const reservationService = {
  async createReservation(input: CreateReservationInput, customer: AuthenticatedCustomer): Promise<Reservation> {
    // A double-click or a retry after a slow response must not book the same table twice.
    if (await reservationRepository.findActiveDuplicate(customer.id, input.date, input.time)) {
      throw ApiError.conflict("You already have a reservation at that date and time.");
    }

    return reservationRepository.createReservation({
      customerId: customer.id,
      customerName: customer.name,
      phone: input.phone,
      email: customer.email,
      date: input.date,
      time: input.time,
      guests: input.guests,
      specialRequests: input.specialRequests,
    });
  },

  /** Someone else's reservation is reported as not found — never as forbidden. */
  async getReservationForCustomer(id: string, customerId: string): Promise<Reservation> {
    const reservation = await reservationRepository.findByIdForCustomer(id, customerId);
    if (!reservation) throw ApiError.notFound(`Reservation ${id} was not found`);
    return reservation;
  },

  listReservationsForCustomer(customerId: string): Promise<Reservation[]> {
    return reservationRepository.listByCustomer(customerId);
  },

  async cancelReservation(id: string, customerId: string): Promise<Reservation> {
    const reservation = await this.getReservationForCustomer(id, customerId);
    if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
      throw ApiError.conflict(`Reservation ${id} is "${reservation.status}" and can no longer be cancelled`);
    }
    const cancelled = await reservationRepository.transition(id, CANCELLABLE_STATUSES, "CANCELLED", null);
    if (!cancelled) throw ApiError.conflict(`Reservation ${id} can no longer be cancelled`);
    return cancelled;
  },
};
