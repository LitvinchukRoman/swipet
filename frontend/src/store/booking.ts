import { create } from 'zustand';

import { bookingService, type Slot } from '@/services/booking';

interface BookingState {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;

  /** Завантажити всі слоти притулку (capacity-модель, без фільтра по даті). */
  fetchSlots: (shelterId: number) => Promise<void>;

  /** Забронювати слот: оптимістично ++bookedCount, відкат при помилці. */
  bookSlot: (slotId: number, notes?: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  slots: [],
  isLoading: false,
  error: null,

  fetchSlots: async (shelterId) => {
    set({ isLoading: true, error: null, slots: [] });
    try {
      const slots = await bookingService.getSlots(shelterId);
      set({ slots, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load time slots. Please try again.' });
    }
  },

  bookSlot: async (slotId, notes) => {
    const prev = get().slots;

    // Оптимістично займаємо місце
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.id === slotId ? { ...slot, bookedCount: slot.bookedCount + 1 } : slot,
      ),
    }));

    try {
      await bookingService.bookSlot(slotId, notes);
    } catch {
      set({ slots: prev });
      throw new Error('Booking failed. Please try again.');
    }
  },
}));
