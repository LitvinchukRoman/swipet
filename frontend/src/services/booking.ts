import {api} from './api';
import type { BookingSlot } from '@/types/models';

// ─── Mock ─────────────────────────────────────
// Set to false when backend is ready
const USE_MOCK = true;

function mockSlotsForDate(shelterId: number, date: string): BookingSlot[] {
  return [
    { id: 1, shelter_id: shelterId, user_id: null, starts_at: `${date}T09:00:00`, ends_at: `${date}T10:00:00`, status: 'AVAILABLE',  notes: null },
    { id: 2, shelter_id: shelterId, user_id: null, starts_at: `${date}T10:00:00`, ends_at: `${date}T11:00:00`, status: 'AVAILABLE',  notes: null },
    { id: 3, shelter_id: shelterId, user_id: 99,   starts_at: `${date}T11:00:00`, ends_at: `${date}T12:00:00`, status: 'BOOKED',     notes: null },
    { id: 4, shelter_id: shelterId, user_id: null, starts_at: `${date}T13:00:00`, ends_at: `${date}T14:00:00`, status: 'AVAILABLE',  notes: null },
    { id: 5, shelter_id: shelterId, user_id: null, starts_at: `${date}T14:30:00`, ends_at: `${date}T15:30:00`, status: 'AVAILABLE',  notes: null },
    { id: 6, shelter_id: shelterId, user_id: null, starts_at: `${date}T16:00:00`, ends_at: `${date}T17:00:00`, status: 'AVAILABLE',  notes: null },
  ];
}

// ─── Service ──────────────────────────────────
export const bookingService = {
  /**
   * GET /api/v1/booking/slots?shelterId={id}&date={YYYY-MM-DD}
   * Returns all slots for a shelter on a given date (no pagination).
   */
  async getSlots(shelterId: number, date: string): Promise<BookingSlot[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 650));
      return mockSlotsForDate(shelterId, date);
    }
    const { data } = await api.get('/booking/slots', {
      params: { shelterId, date },
    });
    return data.slots;
  },

  /**
   * POST /api/v1/booking/slots/:id/book
   * Body: { notes? }   →  Response: { booking: BookingSlot }
   */
  async bookSlot(slotId: number, notes?: string): Promise<BookingSlot> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 750));
      return {} as BookingSlot; // optimistic update handled by store
    }
    const { data } = await api.post(`/booking/slots/${slotId}/book`, {
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    });
    return data.booking;
  },

  /**
   * DELETE /api/v1/booking/slots/:id/book  →  204 No Content
   */
  async cancelBooking(slotId: number): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 550));
      return;
    }
    await api.delete(`/booking/slots/${slotId}/book`);
  },
};