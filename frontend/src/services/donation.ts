import { api } from './api';
import type { Species, VirtualGuardianship } from '@/types/models';

// Donations & Guardianship API (ТЗ 3.7) — підключено до живого бекенду
// (DonationController /api/v1/donations). Платіж — через Stripe (повертається paymentUrl).

export interface OneTimePayload {
  shelterId: number;
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

// Backend DTO: VirtualGuardianshipResponse (плоский — animalName/photo окремими полями).
interface GuardianshipDTO {
  id: number;
  animalId: number;
  animalName: string;
  animalPrimaryPhotoUrl?: string;
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
      species: 'OTHER' as Species,
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
   * ⚠️ BACKEND-ПРОГАЛИНА: ендпоінта GET /donations/verify-session ще НЕМАЄ
   * (DonationController має лише /webhook). Поки повертаємо optimistic success —
   * фактичне підтвердження робить Stripe-вебхук на сервері.
   * TODO(backend): додати GET /donations/verify-session?session_id= і розкоментувати:
   *   return api.get('/donations/verify-session', { params: { session_id: sessionId } }).then(r => r.data);
   */
  verifySession: (sessionId: string): Promise<{ status: string }> =>
    Promise.resolve({ status: 'success' }),
};
