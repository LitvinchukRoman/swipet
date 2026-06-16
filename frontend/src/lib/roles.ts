import type { Href } from 'expo-router';

import type { User } from '@/store/auth';

export type Role = User['role'];

/** Home route group for each role. */
export const HOME_BY_ROLE: Record<Role, Href> = {
  ADMIN: '/(admin)/(tabs)',
  SHELTER_ADMIN: '/(shelter)/(tabs)',
  USER: '/(app)/(tabs)',
};

/** Home route path based on the user's role (defaults safely to USER). */
export function homePathForRole(role?: Role | null): Href {
  return (role && HOME_BY_ROLE[role]) || HOME_BY_ROLE.USER;
}
