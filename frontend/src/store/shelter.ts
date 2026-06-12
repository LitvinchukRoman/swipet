import { create } from 'zustand';

import { aggregateStats, shelterService } from '@/services/shelter';
import type { Animal, AnimalStats, Shelter } from '@/types/models';

export type ShelterStatus = 'idle' | 'loading' | 'ready' | 'no-shelter' | 'error';

interface ShelterState {
  shelter: Shelter | null;
  animals: Animal[];
  stats: Map<number, AnimalStats>;
  status: ShelterStatus;

  /** Завантажує притулок поточного адміна + його тварин + статистику.
   *  Не показує спінер, якщо дані вже є (тихий refresh при фокусі табів). */
  load: () => Promise<void>;
  reset: () => void;
}

export const useShelterStore = create<ShelterState>((set, get) => ({
  shelter: null,
  animals: [],
  stats: new Map(),
  status: 'idle',

  load: async () => {
    if (!get().shelter) set({ status: 'loading' });
    try {
      const myShelter = await shelterService.getMyShelter();
      const [animals, rows] = await Promise.all([
        shelterService.getShelterAnimals(myShelter.id, myShelter.name),
        shelterService.getMyAnalytics().catch(() => []),
      ]);
      set({ shelter: myShelter, animals, stats: aggregateStats(rows), status: 'ready' });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        set({ status: 'no-shelter' });
      } else if (!get().shelter) {
        set({ status: 'error' });
      }
    }
  },

  reset: () => set({ shelter: null, animals: [], stats: new Map(), status: 'idle' }),
}));

/** Сумарні метрики по притулку для дашборду. */
export function summarize(animals: Animal[], stats: Map<number, AnimalStats>) {
  let views = 0;
  let likes = 0;
  let passes = 0;
  let available = 0;
  for (const a of animals) {
    if (a.status === 'AVAILABLE') available += 1;
    const s = stats.get(a.id);
    if (s) {
      views += s.views;
      likes += s.likes;
      passes += s.passes;
    }
  }
  const totalSwipes = likes + passes;
  const likeRate = totalSwipes > 0 ? Math.round((likes / totalSwipes) * 100) : 0;
  return { views, likes, available, total: animals.length, likeRate };
}
