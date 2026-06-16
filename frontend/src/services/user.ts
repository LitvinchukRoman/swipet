import type { User } from '@/store/auth';
import { api } from './api';

// User profile API - connected to the backend (UserController /api/v1/users).

interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: User['role'];
  isEmailVerified: boolean;
}

function mapUser(d: UserDTO): User {
  return {
    id: d.id,
    email: d.email,
    fullName: d.fullName,
    phone: d.phone,
    avatarUrl: d.avatarUrl,
    role: d.role,
    isEmailVerified: d.isEmailVerified,
  };
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export const userService = {
  /** Update user profile. PATCH /users/me -> updated user */
  updateMe: (payload: UpdateProfilePayload): Promise<User> =>
    api.patch<UserDTO>('/users/me', payload).then((r) => mapUser(r.data)),

  /** Upload an avatar image. POST /users/me/avatar (multipart) -> { avatarUrl } */
  uploadAvatar: (file: FormData): Promise<string> =>
    api
      .post<{ avatarUrl: string }>('/users/me/avatar', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.avatarUrl),

  /** Update user geolocation. PATCH /users/me/location */
  setLocation: (lat: number, lng: number): Promise<void> =>
    api.patch('/users/me/location', { lat, lng }).then(() => undefined),
};