import type { Animal, Shelter } from '@/types/models';

import { delay, MOCK_ANIMALS, MOCK_SHELTERS } from './mock';
// import { api } from './api'; // ← коли бекенд готовий

/** Animals + Shelters API (ТЗ 3.3, 3.4). Зараз мок-дані. */
export const animalService = {
  // GET /animals/:id
  getById: async (id: number): Promise<Animal | null> => {
    // TODO: return api.get(`/animals/${id}`).then(r => r.data);
    return delay(MOCK_ANIMALS.find((a) => a.id === id) ?? null);
  },

  // GET /shelters/:id
  getShelter: async (id: number): Promise<Shelter | null> => {
    // TODO: return api.get(`/shelters/${id}`).then(r => r.data);
    const shelter = MOCK_SHELTERS.find((s) => s.id === id);
    if (!shelter) return delay(null);
    const animals = MOCK_ANIMALS.filter((a) => a.shelterId === id);
    return delay({ ...shelter, animals });
  },
};
