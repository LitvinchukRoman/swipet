import { create } from 'zustand';
 
import { bookingService } from '@/services/booking';
import type { BookingSlot } from '@/types/models';
 
interface BookingState {
  slots: BookingSlot[];
  isLoading: boolean;
  error: string | null;
 
  /** Load all slots for a shelter on a given date. Clears previous slots. */
  fetchSlots: (shelterId: number, date: string) => Promise<void>;
 
  /**
   * Book a slot. Optimistically updates local state so the UI responds
   * instantly; reverts on error.
   */
  bookSlot: (slotId: number, currentUserId: number, notes?: string) => Promise<void>;
 
  /**
   * Cancel the current user's booking. Optimistic update — reverts on error.
   */
  cancelBooking: (slotId: number) => Promise<void>;
}
 
export const useBookingStore = create<BookingState>((set, get) => ({
  slots: [],
  isLoading: false,
  error: null,
 
  fetchSlots: async (shelterId, date) => {
    set({ isLoading: true, error: null, slots: [] });
    try {
      const slots = await bookingService.getSlots(shelterId, date);
      set({ slots, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load time slots. Please try again.' });
    }
  },
 
  bookSlot: async (slotId, currentUserId, notes) => {
    const prev = get().slots;
 
    // Optimistic update
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.id === slotId
          ? { ...slot, status: 'BOOKED', user_id: currentUserId }
          : slot,
      ),
    }));
 
    try {
      await bookingService.bookSlot(slotId, notes);
    } catch {
      // Revert on failure
      set({ slots: prev });
      throw new Error('Booking failed. Please try again.');
    }
  },
 
  cancelBooking: async (slotId) => {
    const prev = get().slots;
 
    // Optimistic update
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.id === slotId
          ? { ...slot, status: 'AVAILABLE', user_id: null }
          : slot,
      ),
    }));
 
    try {
      await bookingService.cancelBooking(slotId);
    } catch {
      set({ slots: prev });
      throw new Error('Could not cancel booking. Please try again.');
    }
  },
}));