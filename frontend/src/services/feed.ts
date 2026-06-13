import { api } from './api';
import type { Animal, AnimalSize, FeedFilters, Species, SwipeDirection } from '@/types/models';

export interface FeedCoords {
  lat: number;
  lng: number;
}

// Feed API (ТЗ 3.5) — підключено до живого бекенду (FeedController /api/v1/feed).

// Backend DTO: FeedAnimalResponse (картка стрічки — лише essentials).
interface FeedAnimalDTO {
  id: number;
  name: string;
  species: string;
  ageMonths: number;
  size: string;
  primaryPhotoUrl?: string;
  shelterId: number;
  shelterName: string;
  distanceKm?: number;
}

// Backend DTO: AnimalResponse (повна анкета — для /feed/liked).
interface AnimalDTO {
  id: number;
  shelterId: number;
  name: string;
  species: string;
  breed?: string;
  ageMonths: number;
  size: string;
  gender: string;
  description?: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  status: string;
  primaryPhotoUrl?: string;
}

/** FeedAnimalResponse → Animal (поля, яких немає у картці — дефолти; деталі тягне animalService.getById). */
function mapFeedAnimal(d: FeedAnimalDTO): Animal {
  return {
    id: d.id,
    name: d.name,
    species: d.species as Species,
    ageMonths: d.ageMonths,
    size: d.size as AnimalSize,
    gender: 'MALE',
    isVaccinated: false,
    isSterilized: false,
    status: 'AVAILABLE',
    primaryPhotoUrl: d.primaryPhotoUrl,
    photos: d.primaryPhotoUrl ? [d.primaryPhotoUrl] : [],
    shelterId: d.shelterId,
    shelterName: d.shelterName,
    distanceKm: d.distanceKm,
  };
}

/** AnimalResponse → Animal (повна анкета). */
function mapAnimal(d: AnimalDTO): Animal {
  return {
    id: d.id,
    name: d.name,
    species: d.species as Species,
    breed: d.breed,
    ageMonths: d.ageMonths,
    size: d.size as AnimalSize,
    gender: d.gender as Animal['gender'],
    description: d.description,
    isVaccinated: d.isVaccinated,
    isSterilized: d.isSterilized,
    status: d.status as Animal['status'],
    primaryPhotoUrl: d.primaryPhotoUrl,
    photos: d.primaryPhotoUrl ? [d.primaryPhotoUrl] : [],
    shelterId: d.shelterId,
    shelterName: '',
  };
}

export const feedService = {
  /** Стрічка карток. GET /feed?lat&lng&radiusKm&species&size&ageMax&excludeIds&limit */
  getFeed: (coords: FeedCoords, filters?: FeedFilters, excludeIds?: number[]): Promise<Animal[]> =>
    api
      .get<FeedAnimalDTO[]>('/feed', {
        params: {
          lat: coords.lat,
          lng: coords.lng,
          radiusKm: filters?.radiusKm,
          species: filters?.species,
          size: filters?.size,
          // фільтр приходить у роках → бекенд чекає місяці
          ageMax: filters?.ageMax != null ? filters.ageMax * 12 : undefined,
          excludeIds: excludeIds?.length ? excludeIds.join(',') : undefined,
          limit: 100,
        },
      })
      .then((r) => r.data.map(mapFeedAnimal)),

  /** Записати свайп. POST /feed/swipe */
  swipe: (animalId: number, direction: SwipeDirection): Promise<{ swipeId: number }> =>
    api.post<{ swipeId: number }>('/feed/swipe', { animalId, direction }).then((r) => r.data),

  /** Лайкнуті тварини. GET /feed/liked */
  getLiked: (page = 1, limit = 100): Promise<Animal[]> =>
    api
      .get<AnimalDTO[]>('/feed/liked', { params: { page, limit } })
      .then((r) => r.data.map(mapAnimal)),
};
