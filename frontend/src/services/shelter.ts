import { api } from './api';
import type {
  Animal,
  AnimalAnalyticsRow,
  AnimalSize,
  AnimalStats,
  AnimalStatus,
  Gender,
  Shelter,
  Species,
} from '@/types/models';

// Shelter-admin API — підключено до ЖИВОГО бекенду (ТЗ 3.3, 3.4).
// `api` має baseURL `/api/v1` та інтерсептор з Bearer-токеном.
// Працює лише з піднятим стеком + логіном під роллю SHELTER_ADMIN.

// ─── Backend DTO shapes (для типобезпечного маппінгу) ───────────────────────
interface ShelterResponseDTO {
  id: number;
  adminUserId: number;
  name: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  locationLat?: number;
  locationLng?: number;
  phone?: string;
  websiteUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

interface AnimalResponseDTO {
  id: number;
  shelterId: number;
  name: string;
  species: Species;
  breed?: string;
  ageMonths: number;
  size: AnimalSize;
  gender: Gender;
  description?: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  status: AnimalStatus;
  primaryPhotoUrl?: string;
  createdAt: string;
}

// ─── Payloads ───────────────────────────────────────────────────────────────
export interface AnimalPayload {
  shelterId: number;
  name: string;
  species: Species;
  breed?: string;
  ageMonths: number;
  size: AnimalSize;
  gender: Gender;
  description?: string;
  isVaccinated: boolean;
  isSterilized: boolean;
}

export interface ShelterPayload {
  name: string;
  description?: string;
  address: string;
  city: string;
  locationLat: number;
  locationLng: number;
  phone?: string;
  websiteUrl?: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
function mapShelter(d: ShelterResponseDTO): Shelter {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    logoUrl: d.logoUrl,
    address: d.address,
    city: d.city,
    phone: d.phone,
    websiteUrl: d.websiteUrl,
    isVerified: d.isVerified,
  };
}

function mapAnimal(d: AnimalResponseDTO, shelterName = ''): Animal {
  return {
    id: d.id,
    name: d.name,
    species: d.species,
    breed: d.breed,
    ageMonths: d.ageMonths,
    size: d.size,
    gender: d.gender,
    description: d.description,
    isVaccinated: d.isVaccinated,
    isSterilized: d.isSterilized,
    status: d.status,
    primaryPhotoUrl: d.primaryPhotoUrl,
    photos: d.primaryPhotoUrl ? [d.primaryPhotoUrl] : [],
    shelterId: d.shelterId,
    shelterName,
  };
}

/** Агрегує денні рядки аналітики у сумарну статистику по кожній тварині. */
export function aggregateStats(rows: AnimalAnalyticsRow[]): Map<number, AnimalStats> {
  const byAnimal = new Map<number, AnimalStats>();
  for (const r of rows) {
    const cur =
      byAnimal.get(r.animalId) ??
      { animalId: r.animalId, views: 0, likes: 0, passes: 0, chatOpens: 0, likeRate: 0 };
    cur.views += r.viewsCount;
    cur.likes += r.swipesRight;
    cur.passes += r.swipesLeft;
    cur.chatOpens += r.chatOpens;
    byAnimal.set(r.animalId, cur);
  }
  for (const s of byAnimal.values()) {
    const totalSwipes = s.likes + s.passes;
    s.likeRate = totalSwipes > 0 ? Math.round((s.likes / totalSwipes) * 100) : 0;
  }
  return byAnimal;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const shelterService = {
  /** Притулок поточного адміна. GET /shelters/me */
  getMyShelter: (): Promise<Shelter> =>
    api.get<ShelterResponseDTO>('/shelters/me').then((r) => mapShelter(r.data)),

  /** Тварини притулку. GET /animals?shelterId= */
  getShelterAnimals: (shelterId: number, shelterName = ''): Promise<Animal[]> =>
    api
      .get<AnimalResponseDTO[]>('/animals', { params: { shelterId } })
      .then((r) => r.data.map((a) => mapAnimal(a, shelterName))),

  /** Аналітика. GET /shelters/me/analytics?dateFrom&dateTo */
  getMyAnalytics: (dateFrom?: string, dateTo?: string): Promise<AnimalAnalyticsRow[]> =>
    api
      .get<AnimalAnalyticsRow[]>('/shelters/me/analytics', { params: { dateFrom, dateTo } })
      .then((r) => r.data),

  /** Створити анкету тварини. POST /animals */
  createAnimal: (payload: AnimalPayload): Promise<Animal> =>
    api.post<AnimalResponseDTO>('/animals', payload).then((r) => mapAnimal(r.data)),

  /** Оновити анкету. PATCH /animals/:id */
  updateAnimal: (id: number, payload: AnimalPayload): Promise<Animal> =>
    api.patch<AnimalResponseDTO>(`/animals/${id}`, payload).then((r) => mapAnimal(r.data)),

  /** Видалити анкету. DELETE /animals/:id */
  deleteAnimal: (id: number): Promise<void> =>
    api.delete(`/animals/${id}`).then(() => undefined),

  /** Завантажити фото тварини. POST /animals/:id/photos (multipart) */
  uploadAnimalPhoto: (animalId: number, file: FormData): Promise<void> =>
    api
      .post(`/animals/${animalId}/photos`, file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => undefined),

  /** Зареєструвати притулок. POST /shelters */
  registerShelter: (payload: ShelterPayload): Promise<Shelter> =>
    api.post<ShelterResponseDTO>('/shelters', payload).then((r) => mapShelter(r.data)),

  /** Оновити притулок. PATCH /shelters/:id */
  updateShelter: (id: number, payload: ShelterPayload): Promise<Shelter> =>
    api.patch<ShelterResponseDTO>(`/shelters/${id}`, payload).then((r) => mapShelter(r.data)),
};
