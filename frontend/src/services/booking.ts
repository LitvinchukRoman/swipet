import { api } from './api';

// Booking API - connected to the backend (BookingController).
// The model is based on CAPACITY (maxGuests + bookedCount), rather than single-user free/booked state.
// This is the canonical slot service for BOTH the user booking screen and admin slot management.
//
// Endpoints:
//   GET  /shelters/{shelterId}/slots                 -> List slots (no date filter applied here)
//   POST /shelters/{shelterId}/slots   (SHELTER_ADMIN)-> Create a new slot
//   POST /slots/{slotId}/reservations                -> Book a slot

/** Mirrors the backend BookingSlotResponse. */
export interface Slot {
  id: number;
  shelterId: number;
  startTime: string; // ISO LocalDateTime "2025-06-10T10:00:00"
  endTime: string;
  maxGuests: number;
  bookedCount: number;
}

export interface SlotPayload {
  startTime: string;
  endTime: string;
  maxGuests: number;
}

export interface Reservation {
  id: number;
  slotId: number;
  userId: number;
  notes?: string;
  status: string;
  slotStartTime: string;
  slotEndTime: string;
}

export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

/** My booking details (GET /me/reservations) - includes shelter context. */
export interface MyReservation {
  id: number;
  slotId: number;
  shelterId: number;
  shelterName: string;
  slotStartTime: string;
  slotEndTime: string;
  status: ReservationStatus;
  notes?: string;
}

/** Slot reservation details for shelter admins (GET /slots/:id/reservations). */
export interface SlotReservation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: string;
}

/** Calculate remaining spots in a slot. */
export function spotsLeft(slot: Slot): number {
  return Math.max(0, slot.maxGuests - slot.bookedCount);
}

/** Format start and end ISO strings to a human-readable date and time range. */
export function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  const t = (d: Date) => d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${t(start)}–${t(end)}`;
}

export const bookingService = {
  /** Fetch shelter slots. GET /shelters/{shelterId}/slots */
  getSlots: (shelterId: number): Promise<Slot[]> =>
    api.get<Slot[]>(`/shelters/${shelterId}/slots`).then((r) => r.data),

  /** Create a new slot (admin). POST /shelters/{shelterId}/slots */
  createSlot: (shelterId: number, payload: SlotPayload): Promise<Slot> =>
    api.post<Slot>(`/shelters/${shelterId}/slots`, payload).then((r) => r.data),

  /** Book a slot. POST /slots/{slotId}/reservations */
  bookSlot: (slotId: number, notes?: string): Promise<Reservation> =>
    api.post<Reservation>(`/slots/${slotId}/reservations`, { notes }).then((r) => r.data),

  /** Fetch my reservations. GET /me/reservations */
  getMyReservations: (): Promise<MyReservation[]> =>
    api.get<MyReservation[]>('/me/reservations').then((r) => r.data),

  /** Cancel a reservation (owner / shelter admin / ADMIN). DELETE /reservations/:id */
  cancelReservation: (reservationId: number): Promise<void> =>
    api.delete(`/reservations/${reservationId}`).then(() => undefined),

  /** Get users booked for a slot (shelter admin). GET /slots/:id/reservations */
  getSlotReservations: (slotId: number): Promise<SlotReservation[]> =>
    api.get<SlotReservation[]>(`/slots/${slotId}/reservations`).then((r) => r.data),

  /** Delete a slot along with all its reservations (shelter admin). DELETE /slots/:id */
  deleteSlot: (slotId: number): Promise<void> =>
    api.delete(`/slots/${slotId}`).then(() => undefined),
};
