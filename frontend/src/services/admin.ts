import { api } from './api';

// Admin API - connected to the backend (AdminController, /api/v1/admin).
// All endpoints require the ADMIN role.

export type UserRole = 'USER' | 'SHELTER_ADMIN' | 'ADMIN';

export interface AdminStats {
  userCount: number;
  shelterCount: number;
  animalCount: number;
  pendingShelters: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminShelter {
  id: number;
  name: string;
  city: string;
  adminUserId: number;
  isVerified: boolean;
}

export interface CreateShelterPayload {
  adminEmail: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  locationLat: number;
  locationLng: number;
  phone?: string;
  websiteUrl?: string;
}

interface ShelterResponseDTO {
  id: number;
  adminUserId: number;
  name: string;
  city: string;
  isVerified: boolean;
}

function mapShelter(d: ShelterResponseDTO): AdminShelter {
  return { id: d.id, name: d.name, city: d.city, adminUserId: d.adminUserId, isVerified: d.isVerified };
}

export const adminService = {
  /** Aggregate platform statistics. GET /admin/stats */
  getStats: (): Promise<AdminStats> =>
    api.get<AdminStats>('/admin/stats').then((r) => r.data),

  /** Fetch all users. GET /admin/users */
  getUsers: (): Promise<AdminUser[]> =>
    api.get<AdminUser[]>('/admin/users').then((r) => r.data),

  /** Update user role. PATCH /admin/users/:id/role */
  updateUserRole: (id: number, role: UserRole): Promise<AdminUser> =>
    api.patch<AdminUser>(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  /** Fetch all shelters. GET /admin/shelters */
  getShelters: (): Promise<AdminShelter[]> =>
    api.get<ShelterResponseDTO[]>('/admin/shelters').then((r) => r.data.map(mapShelter)),

  /** Create a shelter and assign an admin. POST /admin/shelters */
  createShelter: (payload: CreateShelterPayload): Promise<AdminShelter> =>
    api.post<ShelterResponseDTO>('/admin/shelters', payload).then((r) => mapShelter(r.data)),

  /** Verify / unverify a shelter. PATCH /admin/shelters/:id/verify */
  verifyShelter: (id: number, verified: boolean): Promise<AdminShelter> =>
    api.patch<ShelterResponseDTO>(`/admin/shelters/${id}/verify`, { verified }).then((r) => mapShelter(r.data)),
};
