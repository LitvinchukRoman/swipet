// Доменні моделі — відповідають таблицям БД та API-контракту з ТЗ (розділи 2-3).

export type Species = 'DOG' | 'CAT' | 'RABBIT' | 'OTHER';
export type AnimalSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type Gender = 'MALE' | 'FEMALE';
export type AnimalStatus = 'AVAILABLE' | 'RESERVED' | 'ADOPTED';
export type SwipeDirection = 'LEFT' | 'RIGHT';

export interface Animal {
  id: number;
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
  photos: string[];
  shelterId: number;
  shelterName: string;
  distanceKm?: number;
}

export interface Shelter {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  phone?: string;
  websiteUrl?: string;
  isVerified: boolean;
  animals?: Animal[];
}

export interface ChatRoom {
  id: number;
  animal: Pick<Animal, 'id' | 'name' | 'primaryPhotoUrl' | 'species'>;
  shelter: Pick<Shelter, 'id' | 'name' | 'logoUrl'>;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  sentAt: string;
}

// Фільтри стрічки (Feed) — query params з ТЗ 3.5
export interface FeedFilters {
  species?: Species;
  size?: AnimalSize;
  ageMax?: number;
  radiusKm?: number;
}
