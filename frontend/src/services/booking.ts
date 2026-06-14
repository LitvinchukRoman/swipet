import { api } from './api';

// Booking API (ТЗ 3.8) — підключено до живого бекенду (BookingController).
// ⚠️ Реальна модель — на МІСТКІСТЬ (maxGuests + bookedCount), а не single-user booked/free.
// Канонічний сервіс слотів для ОБОХ екранів: користувацький booking/[shelterId] та admin shelter/booking/slots.
//
// Ендпоінти:
//   GET  /shelters/{shelterId}/slots                 → список слотів (без фільтра по даті)
//   POST /shelters/{shelterId}/slots   (SHELTER_ADMIN)→ створити слот
//   POST /slots/{slotId}/reservations                → забронювати (без скасування на бекенді)

/** Дзеркалить backend BookingSlotResponse. */
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

/** Моє бронювання (GET /me/reservations) — з контекстом притулку. */
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

/** Бронювання слоту очима адміна притулку (GET /slots/:id/reservations). */
export interface SlotReservation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: string;
}

/** Скільки місць лишилось у слоті. */
export function spotsLeft(slot: Slot): number {
  return Math.max(0, slot.maxGuests - slot.bookedCount);
}

/** "10 чер, 10:00–11:00" з пари ISO-час. */
export function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  const t = (d: Date) => d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${t(start)}–${t(end)}`;
}

export const bookingService = {
  /** Слоти притулку. GET /shelters/{shelterId}/slots */
  getSlots: (shelterId: number): Promise<Slot[]> =>
    api.get<Slot[]>(`/shelters/${shelterId}/slots`).then((r) => r.data),

  /** Створити слот (admin). POST /shelters/{shelterId}/slots */
  createSlot: (shelterId: number, payload: SlotPayload): Promise<Slot> =>
    api.post<Slot>(`/shelters/${shelterId}/slots`, payload).then((r) => r.data),

  /** Забронювати слот. POST /slots/{slotId}/reservations */
  bookSlot: (slotId: number, notes?: string): Promise<Reservation> =>
    api.post<Reservation>(`/slots/${slotId}/reservations`, { notes }).then((r) => r.data),

  /** Мої бронювання. GET /me/reservations */
  getMyReservations: (): Promise<MyReservation[]> =>
    api.get<MyReservation[]>('/me/reservations').then((r) => r.data),

  /** Скасувати бронювання (власник / адмін притулку / ADMIN). DELETE /reservations/:id */
  cancelReservation: (reservationId: number): Promise<void> =>
    api.delete(`/reservations/${reservationId}`).then(() => undefined),

  /** Хто записаний на слот (адмін притулку). GET /slots/:id/reservations */
  getSlotReservations: (slotId: number): Promise<SlotReservation[]> =>
    api.get<SlotReservation[]>(`/slots/${slotId}/reservations`).then((r) => r.data),
};
