import type { Animal, AnimalSize, Shelter, Species } from '@/types/models';
import { api } from './api';

// Animals + Shelters API - connected to the backend.

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
  photos?: { id: number; url: string; sortOrder: number }[];
}

interface ShelterDTO {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  phone?: string;
  websiteUrl?: string;
  isVerified: boolean;
}

function mapAnimal(d: AnimalDTO, shelterName = ''): Animal {
  const photos = d.photos ? [...d.photos] : [];
  if (d.primaryPhotoUrl) {
    const primaryIdx = photos.findIndex((p) => p.url === d.primaryPhotoUrl);
    if (primaryIdx > 0) {
      const [primary] = photos.splice(primaryIdx, 1);
      photos.unshift(primary);
    }
  }

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
    primaryPhotoUrl: d.primaryPhotoUrl ?? photos[0]?.url,
    photos,
    shelterId: d.shelterId,
    shelterName,
  };
}

function mapShelter(d: ShelterDTO): Shelter {
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

export const animalService = {
  /**
   * Detailed animal profile. GET /animals/:id
   * AnimalResponse does not contain shelterName -> fetch it with a separate shelter query.
   */
  getById: async (id: number): Promise<Animal | null> => {
    try {
      const { data } = await api.get<AnimalDTO>(`/animals/${id}`);
      let shelterName = '';
      try {
        const shelter = await api.get<ShelterDTO>(`/shelters/${data.shelterId}`);
        shelterName = shelter.data.name;
      } catch {
        /* Shelter name is not critical for rendering */
      }
      return mapAnimal(data, shelterName);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Shelter profile and its animals. GET /shelters/:id  +  GET /animals?shelterId=
   * (The backend's ShelterResponse doesn't include an animals[] array, so we make two requests.)
   */
  getShelter: async (id: number): Promise<Shelter | null> => {
    try {
      const { data } = await api.get<ShelterDTO>(`/shelters/${id}`);
      const shelter = mapShelter(data);
      try {
        const animals = await api.get<AnimalDTO[]>('/animals', { params: { shelterId: id } });
        shelter.animals = animals.data.map((a) => mapAnimal(a, shelter.name));
      } catch {
        shelter.animals = [];
      }
      return shelter;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
