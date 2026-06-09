import type { Animal, FeedFilters, SwipeDirection } from '@/types/models';

import { delay, MOCK_ANIMALS } from './mock';
// import { api } from './api'; // ← розкоментувати коли бекенд готовий

export interface FeedCoords {
  lat: number;
  lng: number;
}

/**
 * Feed API (ТЗ 3.5). Зараз повертає мок-дані.
 * Коли бекенд запрацює — замінити тіла методів на виклики `api`.
 */
export const feedService = {
  // GET /feed?lat=&lng=&radiusKm=&species=&size=&ageMax=
  getFeed: async (coords: FeedCoords, filters?: FeedFilters): Promise<Animal[]> => {
    // TODO: return api.get('/feed', { params: { ...coords, ...filters } }).then(r => r.data.animals);
    let result = [...MOCK_ANIMALS];
    if (filters?.species) result = result.filter((a) => a.species === filters.species);
    if (filters?.size)    result = result.filter((a) => a.size    === filters.size);
    if (filters?.ageMax != null)
      result = result.filter((a) => a.ageMonths <= filters.ageMax! * 12);
    return delay(result);
  },

  // POST /feed/swipe
  swipe: async (animalId: number, direction: SwipeDirection): Promise<{ swipeId: number }> => {
    // TODO: return api.post('/feed/swipe', { animalId, direction }).then(r => r.data);
    return delay({ swipeId: Date.now() }, 150);
  },

  // GET /feed/liked
  getLiked: async (): Promise<Animal[]> => {
    // TODO: return api.get('/feed/liked').then(r => r.data.animals);
    return delay(MOCK_ANIMALS.slice(0, 2));
  },
};