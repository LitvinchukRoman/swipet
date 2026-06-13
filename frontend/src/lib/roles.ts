import type { Href } from 'expo-router';

import type { User } from '@/store/auth';

export type Role = User['role'];

/** Домашня оболонка (група маршрутів) для кожної ролі. */
export const HOME_BY_ROLE: Record<Role, Href> = {
  ADMIN: '/(admin)/(tabs)',
  SHELTER_ADMIN: '/(shelter)/(tabs)',
  USER: '/(app)/(tabs)',
};

/** Шлях на домашній екран за роллю (з безпечним фолбеком на USER). */
export function homePathForRole(role?: Role | null): Href {
  return (role && HOME_BY_ROLE[role]) || HOME_BY_ROLE.USER;
}
