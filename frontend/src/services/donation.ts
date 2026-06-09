import type { VirtualGuardianship } from '@/types/models';

import { delay, MOCK_ANIMALS } from './mock';
// import { api } from './api'; // ← розкоментувати коли бекенд готовий

export interface OneTimePayload {
  shelterId: number;
  animalId?: number;
  amount: number;
}

export interface GuardianshipPayload {
  animalId: number;
  monthlyAmount: number;
}

export interface PaymentResponse {
  paymentUrl: string;
}

export interface GuardianshipResponse {
  guardianship: VirtualGuardianship;
  paymentUrl: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_GUARDIANSHIPS: VirtualGuardianship[] = [
  {
    id: 1,
    userId: 99,
    animalId: MOCK_ANIMALS[0].id,
    animal: {
      id:              MOCK_ANIMALS[0].id,
      name:            MOCK_ANIMALS[0].name,
      primaryPhotoUrl: MOCK_ANIMALS[0].primaryPhotoUrl,
      breed:           MOCK_ANIMALS[0].breed,
      species:         MOCK_ANIMALS[0].species,
    },
    monthlyAmount: 300,
    isActive:      true,
    startedAt:     new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
    nextBillingAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // in 15 days
  },
  {
    id: 2,
    userId: 99,
    animalId: MOCK_ANIMALS[2].id,
    animal: {
      id:              MOCK_ANIMALS[2].id,
      name:            MOCK_ANIMALS[2].name,
      primaryPhotoUrl: MOCK_ANIMALS[2].primaryPhotoUrl,
      breed:           MOCK_ANIMALS[2].breed,
      species:         MOCK_ANIMALS[2].species,
    },
    monthlyAmount: 150,
    isActive:      true,
    startedAt:     new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago
    nextBillingAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(), // in 18 days
  },
  {
    id: 3,
    userId: 99,
    animalId: MOCK_ANIMALS[4].id,
    animal: {
      id:              MOCK_ANIMALS[4].id,
      name:            MOCK_ANIMALS[4].name,
      primaryPhotoUrl: MOCK_ANIMALS[4].primaryPhotoUrl,
      breed:           MOCK_ANIMALS[4].breed,
      species:         MOCK_ANIMALS[4].species,
    },
    monthlyAmount: 200,
    isActive:      false,
    startedAt:     new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days ago
    nextBillingAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // expired
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────
export const donationService = {
  /** POST /donations/one-time — initiate a one-time donation */
  createOneTime: (payload: OneTimePayload): Promise<PaymentResponse> =>
    // TODO: return api.post('/donations/one-time', payload).then(r => r.data);
    delay({ paymentUrl: 'https://mock-payment.example.com/one-time' }, 400),

  /** POST /donations/guardianship — become virtual guardian */
  createGuardianship: (payload: GuardianshipPayload): Promise<GuardianshipResponse> =>
    // TODO: return api.post('/donations/guardianship', payload).then(r => r.data);
    delay(
      {
        guardianship: {
          ...MOCK_GUARDIANSHIPS[0],
          id:            Date.now(),
          animalId:      payload.animalId,
          monthlyAmount: payload.monthlyAmount,
          isActive:      true,
          startedAt:     new Date().toISOString(),
          nextBillingAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        paymentUrl: 'https://mock-payment.example.com/guardianship',
      },
      400
    ),

  /** DELETE /donations/guardianship/:id — cancel guardianship */
  cancelGuardianship: (id: number): Promise<void> =>
    // TODO: return api.delete(`/donations/guardianship/${id}`).then(() => undefined);
    delay(undefined as unknown as void, 300),

  /** GET /donations/my-guardianships — list my active & past guardianships */
  getMyGuardianships: (): Promise<VirtualGuardianship[]> =>
    // TODO: return api.get('/donations/my-guardianships').then(r => r.data.guardianships);
    delay(MOCK_GUARDIANSHIPS),

  /** GET /donations/verify-session?session_id=xxx — перевірка Stripe Checkout Session.
   *  Викликається на екрані /payment-success після redirect від Stripe.
   *  TODO: return api.get('/donations/verify-session', { params: { session_id } }).then(r => r.data);
   */
  verifySession: (sessionId: string): Promise<{ status: string }> =>
    delay({ status: 'success' }, 600),
};