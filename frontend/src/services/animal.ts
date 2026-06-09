import { api } from './api';
import type { Animal, AnimalSize, Gender, Shelter, Species } from '@/types/models';

// Animals + Shelters API (ТЗ 3.3, 3.4) — підключено до живого бекенду.

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
  return {
    id: d.id,
    name: d.name,
    species: d.species as Species,
    breed: d.breed,
    ageMonths: d.ageMonths,
    size: d.size as AnimalSize,
    gender: d.gender as Gender,
    description: d.description,
    isVaccinated: d.isVaccinated,
    isSterilized: d.isSterilized,
    status: d.status as Animal['status'],
    primaryPhotoUrl: d.primaryPhotoUrl,
    photos: d.primaryPhotoUrl ? [d.primaryPhotoUrl] : [],
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
   * Детальна картка тварини. GET /animals/:id
   * AnimalResponse не містить shelterName → дотягуємо його окремим запитом притулку.
   */
  getById: async (id: number): Promise<Animal | null> => {
    try {
      const { data } = await api.get<AnimalDTO>(`/animals/${id}`);
      let shelterName = '';
      try {
        const shelter = await api.get<ShelterDTO>(`/shelters/${data.shelterId}`);
        shelterName = shelter.data.name;
      } catch {
        /* назва притулку не критична для рендеру */
      }
      return mapAnimal(data, shelterName);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Профіль притулку + його тварини. GET /shelters/:id  +  GET /animals?shelterId=
   * (ShelterResponse бекенду не містить animals[], тож робимо два запити.)
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
