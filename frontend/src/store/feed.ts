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
  /** 
   * Incremented upon new feed fetch or filter changes. 
   * Used during pre-fetching to prevent race conditions where 
   * cards from an old filter are appended to an updated feed.
   */
  feedEpoch: number;

  setCoords: (coords: FeedCoords) => void;
  setFilters: (filters: FeedFilters) => void;
  loadFeed: (coords?: FeedCoords, filters?: FeedFilters) => Promise<void>;
  /** Fetch all liked animals from the server. */
  loadLiked: () => Promise<void>;
  swipe: (animal: Animal, direction: SwipeDirection) => void;
  /** Like an animal from the details screen: persists a RIGHT swipe and idempotently adds to liked list. */
  likeAnimal: (animal: Animal) => Promise<void>;
  /** The backend currently lacks an "unlike" endpoint. This only removes it from the local state. */
  unlikeAnimal: (animalId: number) => void;
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
  feedEpoch: 0,

  setCoords: (coords) => set({ coords }),

  setFilters: (filters) => set((s) => ({ filters, feedEpoch: s.feedEpoch + 1 })),

  loadFeed: async (coords, filters) => {
    const state = get();
    const resolvedCoords  = coords  ?? state.coords;
    const resolvedFilters = filters ?? state.filters;
    if (!resolvedCoords) return;

    // A new feed epoch invalidates any in-flight prefetch for the previous feed state.
    const epoch = state.feedEpoch + 1;
    set({ isLoading: true, feedEpoch: epoch });
    try {
      const newCards = await feedService.getFeed(resolvedCoords, resolvedFilters);
      // Do not overwrite results if the feed epoch has changed during the request.
      if (get().feedEpoch !== epoch) return;
      set({ cards: newCards, currentIndex: 0, isLoading: false, coords: resolvedCoords, filters: resolvedFilters });
    } catch {
      if (get().feedEpoch === epoch) set({ isLoading: false });
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
    // Optimistically send the swipe. On failure during a RIGHT swipe, rollback the like
    // so the Favorites screen doesn't show an unacknowledged action.
    feedService.swipe(animal.id, direction).catch(() => {
      if (direction === 'RIGHT') {
        set((state) => ({ liked: state.liked.filter((a) => a.id !== animal.id) }));
      }
    });

    set((state) => {
      const nextIndex = state.currentIndex + 1;
      const remaining = state.cards.length - nextIndex;

      // Initiate pre-fetch when cards remaining are <= PREFETCH_THRESHOLD
      if (remaining <= PREFETCH_THRESHOLD && !state.isPrefetching && state.coords) {
        const epoch = state.feedEpoch;
        setTimeout(() => {
          const s = get();
          if (s.isPrefetching || s.isLoading || s.feedEpoch !== epoch) return;
          set({ isPrefetching: true });
          feedService
            .getFeed(s.coords!, s.filters, s.cards.map((c) => c.id))
            .then((newCards) => {
              // Discard fetched cards if the filter or feed changed during the network request.
              if (get().feedEpoch !== epoch) {
                set({ isPrefetching: false });
                return;
              }
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

  likeAnimal: async (animal) => {
    const already = get().liked.some((a) => a.id === animal.id);
    if (!already) set((state) => ({ liked: [animal, ...state.liked] }));
    try {
      await feedService.swipe(animal.id, 'RIGHT');
    } catch {
      // Retain the optimistic state since the animal might have already been liked (swipe exists).
    }
  },

  unlikeAnimal: (animalId) => {
    set((state) => ({ liked: state.liked.filter((a) => a.id !== animalId) }));
  },

  reset: () => set({ cards: [], currentIndex: 0, isLoading: false, isPrefetching: false }),
}));