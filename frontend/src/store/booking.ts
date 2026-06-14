import { create } from 'zustand';

import { bookingService, type MyReservation, type Slot } from '@/services/booking';

interface BookingState {
  slots: Slot[];
  myReservations: MyReservation[];
  isLoading: boolean;
  error: string | null;

  /** Завантажити слоти притулку + мої бронювання (щоб знати, на що я записаний). */
  fetchSlots: (shelterId: number) => Promise<void>;

  /** Лише мої бронювання (для екрана «My visits»). */
  fetchMyReservations: () => Promise<void>;

  /** Забронювати слот: оптимістично ++bookedCount, відкат при помилці. */
  bookSlot: (slotId: number, notes?: string) => Promise<void>;

  /** Скасувати бронювання: оптимістично прибрати + звільнити місце, відкат при помилці. */
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
      // лишаємо попередній стан
    }
  },

  bookSlot: async (slotId, notes) => {
    const prevSlots = get().slots;

    // Оптимістично займаємо місце
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.id === slotId ? { ...slot, bookedCount: slot.bookedCount + 1 } : slot,
      ),
    }));

    try {
      await bookingService.bookSlot(slotId, notes);
      // Підтягуємо свіжі брони — щоб з'явився reservationId для скасування.
      await get().fetchMyReservations();
    } catch {
      set({ slots: prevSlots });
      throw new Error('Booking failed. Please try again.');
    }
  },

  cancelReservation: async (reservationId) => {
    const { slots, myReservations } = get();
    const res = myReservations.find((r) => r.id === reservationId);

    // Оптимістично: прибираємо бронь і звільняємо місце у відповідному слоті.
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
