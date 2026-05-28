import { create } from 'zustand';

import { feedService } from '@/services/feed';
import type { Animal, FeedFilters, SwipeDirection } from '@/types/models';

interface FeedState {
  cards: Animal[];
  currentIndex: number;
  liked: Animal[];
  isLoading: boolean;
  filters: FeedFilters;

  loadFeed: (filters?: FeedFilters) => Promise<void>;
  swipe: (animal: Animal, direction: SwipeDirection) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  liked: [],
  isLoading: false,
  filters: {},

  loadFeed: async (filters) => {
    set({ isLoading: true, filters: filters ?? {} });
    try {
      const cards = await feedService.getFeed(filters);
      set({ cards, currentIndex: 0, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  swipe: (animal, direction) => {
    // Оптимістично рухаємо стрічку, запит летить у фоні
    feedService.swipe(animal.id, direction).catch(() => {});
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      liked:
        direction === 'RIGHT' && !state.liked.some((a) => a.id === animal.id)
          ? [animal, ...state.liked]
          : state.liked,
    }));
  },

  reset: () => set({ cards: [], currentIndex: 0, isLoading: false }),
}));
