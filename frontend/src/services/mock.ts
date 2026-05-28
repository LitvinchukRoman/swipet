import type { Animal, ChatMessage, ChatRoom, Shelter } from '@/types/models';

// Тимчасові дані для розробки UI поки бекенд не готовий.
// Фото — публічний Unsplash CDN. Коли API запрацює — ці масиви прибираємо.

export const MOCK_SHELTERS: Shelter[] = [
  {
    id: 1,
    name: 'Притулок «Сіріус»',
    description: 'Найбільший притулок для безпритульних тварин у Київській області.',
    address: 'вул. Молодіжна 1, смт Бородянка',
    city: 'Київ',
    phone: '+380 44 123 4567',
    websiteUrl: 'https://sirius.org.ua',
    isVerified: true,
  },
  {
    id: 2,
    name: 'Хвостата команда',
    description: 'Невеликий волонтерський притулок у центрі міста.',
    address: 'вул. Сагайдачного 12',
    city: 'Львів',
    phone: '+380 32 765 4321',
    isVerified: true,
  },
];

export const MOCK_ANIMALS: Animal[] = [
  {
    id: 1,
    name: 'Рекс',
    species: 'DOG',
    breed: 'Лабрадор (метис)',
    ageMonths: 26,
    size: 'LARGE',
    gender: 'MALE',
    description:
      'Дуже добрий і грайливий хлопчина. Обожнює довгі прогулянки та активні ігри. Чудово ладнає з дітьми.',
    isVaccinated: true,
    isSterilized: true,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
      'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&q=80',
    ],
    shelterId: 1,
    shelterName: 'Притулок «Сіріус»',
    distanceKm: 2.4,
  },
  {
    id: 2,
    name: 'Мурка',
    species: 'CAT',
    breed: 'Європейська короткошерста',
    ageMonths: 8,
    size: 'SMALL',
    gender: 'FEMALE',
    description: 'Ласкава кішечка, любить спати на колінах і муркотіти годинами.',
    isVaccinated: true,
    isSterilized: false,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80',
    ],
    shelterId: 1,
    shelterName: 'Притулок «Сіріус»',
    distanceKm: 2.4,
  },
  {
    id: 3,
    name: 'Боня',
    species: 'DOG',
    breed: 'Корґі',
    ageMonths: 14,
    size: 'MEDIUM',
    gender: 'FEMALE',
    description: 'Енергійна та розумна. Знає базові команди, швидко вчиться новому.',
    isVaccinated: true,
    isSterilized: true,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=800&q=80'],
    shelterId: 2,
    shelterName: 'Хвостата команда',
    distanceKm: 5.1,
  },
  {
    id: 4,
    name: 'Сніжок',
    species: 'RABBIT',
    breed: 'Карликовий',
    ageMonths: 5,
    size: 'SMALL',
    gender: 'MALE',
    description: 'Тихий і охайний. Ідеальний компаньйон для спокійної оселі.',
    isVaccinated: true,
    isSterilized: false,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&q=80'],
    shelterId: 2,
    shelterName: 'Хвостата команда',
    distanceKm: 5.1,
  },
  {
    id: 5,
    name: 'Том',
    species: 'CAT',
    breed: 'Мейн-кун (метис)',
    ageMonths: 36,
    size: 'MEDIUM',
    gender: 'MALE',
    description: 'Поважний кіт із характером. Любить спостерігати за світом з підвіконня.',
    isVaccinated: true,
    isSterilized: true,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80'],
    shelterId: 1,
    shelterName: 'Притулок «Сіріус»',
    distanceKm: 2.4,
  },
  {
    id: 6,
    name: 'Арчі',
    species: 'DOG',
    breed: 'Бігль',
    ageMonths: 18,
    size: 'MEDIUM',
    gender: 'MALE',
    description: 'Цікавий до всього носик. Любить нюхати сліди та досліджувати нові місця.',
    isVaccinated: true,
    isSterilized: true,
    status: 'AVAILABLE',
    primaryPhotoUrl:
      'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80'],
    shelterId: 2,
    shelterName: 'Хвостата команда',
    distanceKm: 5.1,
  },
];

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 101,
    animal: { id: 1, name: 'Рекс', primaryPhotoUrl: MOCK_ANIMALS[0].primaryPhotoUrl, species: 'DOG' },
    shelter: { id: 1, name: 'Притулок «Сіріус»' },
    lastMessage: 'Вітаємо! Так, Рекс ще шукає дім 🐾',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unreadCount: 2,
  },
  {
    id: 102,
    animal: { id: 3, name: 'Боня', primaryPhotoUrl: MOCK_ANIMALS[2].primaryPhotoUrl, species: 'DOG' },
    shelter: { id: 2, name: 'Хвостата команда' },
    lastMessage: 'Можемо домовитись про візит на вихідних',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    unreadCount: 0,
  },
];

export const MOCK_MESSAGES: Record<number, ChatMessage[]> = {
  101: [
    { id: 1, roomId: 101, senderId: 99, content: 'Доброго дня! Цікавить Рекс, він ще доступний?', isRead: true, sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 2, roomId: 101, senderId: 1, content: 'Вітаємо! Так, Рекс ще шукає дім 🐾', isRead: false, sentAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { id: 3, roomId: 101, senderId: 1, content: 'Коли вам зручно завітати?', isRead: false, sentAt: new Date(Date.now() - 1000 * 60 * 11).toISOString() },
  ],
  102: [
    { id: 4, roomId: 102, senderId: 99, content: 'Хочу познайомитись з Бонею', isRead: true, sentAt: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString() },
    { id: 5, roomId: 102, senderId: 2, content: 'Можемо домовитись про візит на вихідних', isRead: true, sentAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
  ],
};

/** Імітація мережевої затримки, щоб бачити стани завантаження. */
export function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
