// Доменні моделі — відповідають таблицям БД та API-контракту з ТЗ (розділи 2-3).

/**
 * Core domain models and TypeScript interfaces used across the application.
 * Includes models for Users, Animals, Shelters, Bookings, Chats, and Analytics.
 */
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
  photos: { id: number; url: string; sortOrder: number }[];
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
  locationLat?: number;
  locationLng?: number;
  phone?: string;
  websiteUrl?: string;
  isVerified: boolean;
  animals?: Animal[];
}

export interface ChatRoom {
  id: number;
  /** Усиновлювач — автор кімнати (видно імʼя притулку-адміну). */
  user: { id: number; name: string; avatarUrl?: string };
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


/** Рядок аналітики — дзеркалить backend AnimalAnalyticsResponse (GET /shelters/me/analytics). */
export interface AnimalAnalyticsRow {
  animalId: number;
  animalName: string;
  date: string;          // ISO date "2025-06-09"
  viewsCount: number;
  swipesRight: number;
  swipesLeft: number;
  chatOpens: number;
}

/** Агрегована статистика по одній тварині (для quick-stats у дашборді). */
export interface AnimalStats {
  animalId: number;
  views: number;
  likes: number;          // swipes right
  passes: number;         // swipes left
  chatOpens: number;
  /** % лайків серед усіх свайпів */
  likeRate: number;
}


export type DonationType   = 'ONE_TIME' | 'SUBSCRIPTION';
export type DonationStatus = 'PENDING'  | 'SUCCESS' | 'FAILED';

/** donations table */
export interface Donation {
  id: number;
  userId: number;
  shelterId: number;
  animalId?: number;           // null = донат притулку без прив'язки до тварини
  amount: number;              // UAH
  type: DonationType;
  status: DonationStatus;
  externalTxId?: string;       // ID транзакції платіжного шлюзу
  createdAt: string;
}

/** virtual_guardianships table */
export interface VirtualGuardianship {
  id: number;
  userId: number;
  animalId: number;
  monthlyAmount: number;       // UAH
  isActive: boolean;
  startedAt: string;           // ISO date string
  nextBillingAt: string;       // ISO date string
  /** Populated by API join — animal snapshot */
  animal?: Pick<Animal, 'id' | 'name' | 'primaryPhotoUrl' | 'species' | 'breed'>;
}

export type BookingSlotStatus = 'AVAILABLE' | 'BOOKED' | 'CANCELLED';
 
/** Matches the DB schema exactly (snake_case) as per API contract */
export interface BookingSlot {
  id: number;
  shelter_id: number;
  /** null  → slot is free; number → userId who booked it */
  user_id: number | null;
  starts_at: string; // ISO 8601  e.g. "2025-06-10T10:00:00"
  ends_at: string;
  status: BookingSlotStatus;
  notes: string | null;
}
 