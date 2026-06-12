import { create } from 'zustand';

import { feedService, type FeedCoords } from '@/services/feed';
import type { Animal, FeedFilters, SwipeDirection } from '@/types/models';

const PREFETCH_THRESHOLD = 3;

interface FeedState {
  cards: Animal[];
  currentIndex: number;
  liked: Animal[];
  isLoading: boolean;
  isLikedLoading: boolean;
  isPrefetching: boolean;
  coords: FeedCoords | null;
  filters: FeedFilters;

  setCoords: (coords: FeedCoords) => void;
  setFilters: (filters: FeedFilters) => void;
  loadFeed: (coords?: FeedCoords, filters?: FeedFilters) => Promise<void>;
  /** Завантажити всі лайкнуті тварини з сервера */
  loadLiked: () => Promise<void>;
  swipe: (animal: Animal, direction: SwipeDirection) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  liked: [],
  isLoading: false,
  isLikedLoading: false,
  isPrefetching: false,
  coords: null,
  filters: {},

  setCoords: (coords) => set({ coords }),

  setFilters: (filters) => set({ filters }),

  loadFeed: async (coords, filters) => {
    const state = get();
    const resolvedCoords  = coords  ?? state.coords;
    const resolvedFilters = filters ?? state.filters;
    if (!resolvedCoords) return;

    set({ isLoading: true });
    try {
      const newCards = await feedService.getFeed(resolvedCoords, resolvedFilters);
      set({ cards: newCards, currentIndex: 0, isLoading: false, coords: resolvedCoords, filters: resolvedFilters });
    } catch {
      set({ isLoading: false });
    }
  },

  loadLiked: async () => {
    set({ isLikedLoading: true });
    try {
      const animals = await feedService.getLiked();
      set({ liked: animals, isLikedLoading: false });
    } catch {
      set({ isLikedLoading: false });
    }
  },

  swipe: (animal, direction) => {
    // Оптимістично надсилаємо свайп
    feedService.swipe(animal.id, direction).catch(() => {});

    set((state) => {
      const nextIndex = state.currentIndex + 1;
      const remaining = state.cards.length - nextIndex;

      // Pre-fetch коли ≤ PREFETCH_THRESHOLD карток
      if (remaining <= PREFETCH_THRESHOLD && !state.isPrefetching && state.coords) {
        setTimeout(() => {
          const s = get();
          if (s.isPrefetching || s.isLoading) return;
          set({ isPrefetching: true });
          feedService
            .getFeed(s.coords!, s.filters)
            .then((newCards) => {
              set((prev) => ({
                cards: [
                  ...prev.cards,
                  ...newCards.filter((c) => !prev.cards.some((p) => p.id === c.id)),
                ],
                isPrefetching: false,
              }));
            })
            .catch(() => set({ isPrefetching: false }));
        }, 0);
      }

      return {
        currentIndex: nextIndex,
        liked:
          direction === 'RIGHT' && !state.liked.some((a) => a.id === animal.id)
            ? [animal, ...state.liked]
            : state.liked,
      };
    });
  },

  reset: () => set({ cards: [], currentIndex: 0, isLoading: false, isPrefetching: false }),
}));