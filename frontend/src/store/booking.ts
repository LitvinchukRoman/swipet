import { create } from 'zustand';

import { bookingService, type MyReservation, type Slot } from '@/services/booking';

interface BookingState {
  slots: Slot[];
  myReservations: MyReservation[];
  isLoading: boolean;
  error: string | null;

  /** Fetch shelter slots and my reservations (to know what I'm currently booked for). */
  fetchSlots: (shelterId: number) => Promise<void>;

  /** Fetch only my reservations (for the "My visits" screen). */
  fetchMyReservations: () => Promise<void>;

  /** Book a slot: optimistically increment bookedCount, revert on error. */
  bookSlot: (slotId: number, notes?: string) => Promise<void>;

  /** Cancel a reservation: optimistically remove it and free up the spot, revert on error. */
  cancelReservation: (reservationId: number) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  slots: [],
  myReservations: [],
  isLoading: false,
  error: null,

  fetchSlots: async (shelterId) => {
    set({ isLoading: true, error: null, slots: [] });
    try {
      const [slots, mine] = await Promise.all([
        bookingService.getSlots(shelterId),
        bookingService.getMyReservations().catch(() => get().myReservations),
      ]);
      set({ slots, myReservations: mine, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load time slots. Please try again.' });
    }
  },

  fetchMyReservations: async () => {
    try {
      const mine = await bookingService.getMyReservations();
      set({ myReservations: mine });
    } catch {
      // retain previous state
    }
  },

  bookSlot: async (slotId, notes) => {
    const prevSlots = get().slots;

    // Optimistically book the spot
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.id === slotId ? { ...slot, bookedCount: slot.bookedCount + 1 } : slot,
      ),
    }));

    try {
      await bookingService.bookSlot(slotId, notes);
      // Fetch fresh bookings to retrieve the reservationId required for cancellation.
      await get().fetchMyReservations();
    } catch {
      set({ slots: prevSlots });
      throw new Error('Booking failed. Please try again.');
    }
  },

  cancelReservation: async (reservationId) => {
    const { slots, myReservations } = get();
    const res = myReservations.find((r) => r.id === reservationId);

    // Optimistically remove the reservation and free up the space in the corresponding slot.
    set({
      myReservations: myReservations.filter((r) => r.id !== reservationId),
      slots: res
        ? slots.map((slot) =>
            slot.id === res.slotId ? { ...slot, bookedCount: Math.max(0, slot.bookedCount - 1) } : slot,
          )
        : slots,
    });

    try {
      await bookingService.cancelReservation(reservationId);
    } catch {
      set({ slots, myReservations });
      throw new Error('Could not cancel. Please try again.');
    }
  },
}));
