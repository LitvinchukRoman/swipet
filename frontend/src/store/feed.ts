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
  /** Зростає при кожному новому фіді/зміні фільтра. Pre-fetch порівнює епоху,
   *  щоб не дописати картки старого фільтра у вже оновлений фід (race). */
  feedEpoch: number;

  setCoords: (coords: FeedCoords) => void;
  setFilters: (filters: FeedFilters) => void;
  loadFeed: (coords?: FeedCoords, filters?: FeedFilters) => Promise<void>;
  /** Завантажити всі лайкнуті тварини з сервера */
  loadLiked: () => Promise<void>;
  swipe: (animal: Animal, direction: SwipeDirection) => void;
  /** Лайк з екрана деталей: персистимо свайп RIGHT + додаємо в liked (ідемпотентно). */
  likeAnimal: (animal: Animal) => Promise<void>;
  /** Бекенд не має "unlike"-ендпоінта — прибираємо лише з локального списку. */
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

    // Нова епоха фіда: будь-який in-flight prefetch старого фіда буде відкинуто.
    const epoch = state.feedEpoch + 1;
    set({ isLoading: true, feedEpoch: epoch });
    try {
      const newCards = await feedService.getFeed(resolvedCoords, resolvedFilters);
      // Якщо за час запиту фід знову змінили — не перетираємо новіший результат.
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
    // Оптимістично надсилаємо свайп; на помилці RIGHT — відкочуємо лайк,
    // щоб Favorites не показували те, що сервер не прийняв.
    feedService.swipe(animal.id, direction).catch(() => {
      if (direction === 'RIGHT') {
        set((state) => ({ liked: state.liked.filter((a) => a.id !== animal.id) }));
      }
    });

    set((state) => {
      const nextIndex = state.currentIndex + 1;
      const remaining = state.cards.length - nextIndex;

      // Pre-fetch коли ≤ PREFETCH_THRESHOLD карток
      if (remaining <= PREFETCH_THRESHOLD && !state.isPrefetching && state.coords) {
        const epoch = state.feedEpoch;
        setTimeout(() => {
          const s = get();
          if (s.isPrefetching || s.isLoading || s.feedEpoch !== epoch) return;
          set({ isPrefetching: true });
          feedService
            .getFeed(s.coords!, s.filters, s.cards.map((c) => c.id))
            .then((newCards) => {
              // Фільтр/фід змінився під час prefetch — відкидаємо старі картки.
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
      // Лишаємо optimistic-стан: тварина могла бути вже лайкнута раніше (свайп існує).
    }
  },

  unlikeAnimal: (animalId) => {
    set((state) => ({ liked: state.liked.filter((a) => a.id !== animalId) }));
  },

  reset: () => set({ cards: [], currentIndex: 0, isLoading: false, isPrefetching: false }),
}));