import { api } from './api';
import type { Species, VirtualGuardianship } from '@/types/models';

// Donations & Guardianship API (ТЗ 3.7) — підключено до живого бекенду
// (DonationController /api/v1/donations). Платіж — через Stripe (повертається paymentUrl).

export interface OneTimePayload {
  shelterId?: number; // опційно — бекенд резолвить притулок з animalId
  animalId?: number;
  amount: number; // UAH
}

export interface GuardianshipPayload {
  animalId: number;
  monthlyAmount: number; // UAH/міс
}

export interface PaymentResponse {
  paymentUrl: string;
}

export type PaymentVerificationStatus = 'success' | 'pending' | 'failed';

// Backend DTO: VirtualGuardianshipResponse (плоский — animalName/photo окремими полями).
interface GuardianshipDTO {
  id: number;
  animalId: number;
  animalName: string;
  animalPrimaryPhotoUrl?: string;
  animalSpecies: Species;
  animalBreed?: string;
  monthlyAmount: number;
  isActive: boolean;
  startedAt: string;
  nextBillingAt: string;
}

function mapGuardianship(d: GuardianshipDTO): VirtualGuardianship {
  return {
    id: d.id,
    userId: 0, // бекенд не повертає (резолвиться з JWT)
    animalId: d.animalId,
    monthlyAmount: d.monthlyAmount,
    isActive: d.isActive,
    startedAt: d.startedAt,
    nextBillingAt: d.nextBillingAt,
    animal: {
      id: d.animalId,
      name: d.animalName,
      primaryPhotoUrl: d.animalPrimaryPhotoUrl,
      species: d.animalSpecies ?? ('OTHER' as Species),
      breed: d.animalBreed,
    },
  };
}

export const donationService = {
  /** Разовий донат. POST /donations/one-time → { paymentUrl } */
  createOneTime: (payload: OneTimePayload): Promise<PaymentResponse> =>
    api.post<PaymentResponse>('/donations/one-time', payload).then((r) => r.data),

  /** Стати опікуном. POST /donations/guardianship → { paymentUrl } */
  createGuardianship: (payload: GuardianshipPayload): Promise<PaymentResponse> =>
    api.post<PaymentResponse>('/donations/guardianship', payload).then((r) => r.data),

  /** Відмінити опікунство. DELETE /donations/guardianship/:id */
  cancelGuardianship: (id: number): Promise<void> =>
    api.delete(`/donations/guardianship/${id}`).then(() => undefined),

  /** Мої підопічні. GET /donations/my-guardianships */
  getMyGuardianships: (): Promise<VirtualGuardianship[]> =>
    api
      .get<GuardianshipDTO[]>('/donations/my-guardianships')
      .then((r) => r.data.map(mapGuardianship)),

  /**
   * Перевірка Stripe Checkout Session після redirect на /payment-success.
   * GET /donations/verify-session?session_id= → { status: 'success' | 'pending' | 'failed' }.
   * Бекенд звертається до Stripe напряму, тож результат реальний (не optimistic).
   */
  verifySession: (sessionId: string): Promise<{ status: PaymentVerificationStatus }> =>
    api
      .get<{ status: PaymentVerificationStatus }>('/donations/verify-session', {
        params: { session_id: sessionId },
      })
      .then((r) => r.data),
};
