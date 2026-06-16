import type { Species, VirtualGuardianship } from '@/types/models';
import { api } from './api';

// Donations & Guardianship API - connected to the backend
// (DonationController /api/v1/donations). Payment is handled via Stripe (returns paymentUrl).

export interface OneTimePayload {
  shelterId?: number; // optional - the backend resolves the shelter from the animalId
  animalId?: number;
  amount: number; // UAH
}

export interface GuardianshipPayload {
  animalId: number;
  monthlyAmount: number; // UAH/month
}

export interface PaymentResponse {
  paymentUrl: string;
}

export type PaymentVerificationStatus = 'success' | 'pending' | 'failed';

// Backend DTO: VirtualGuardianshipResponse (flat - animalName/photo as separate fields).
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
    userId: 0, // not returned by the backend (resolved from JWT)
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
  /** One-time donation. POST /donations/one-time -> { paymentUrl } */
  createOneTime: (payload: OneTimePayload): Promise<PaymentResponse> =>
    api.post<PaymentResponse>('/donations/one-time', payload).then((r) => r.data),

  /** Become a guardian. POST /donations/guardianship -> { paymentUrl } */
  createGuardianship: (payload: GuardianshipPayload): Promise<PaymentResponse> =>
    api.post<PaymentResponse>('/donations/guardianship', payload).then((r) => r.data),

  /** Cancel guardianship. DELETE /donations/guardianship/:id */
  cancelGuardianship: (id: number): Promise<void> =>
    api.delete(`/donations/guardianship/${id}`).then(() => undefined),

  /** Get a payment link for overdue/pending guardianship */
  getPendingGuardianshipPayment: (id: number): Promise<PaymentResponse> =>
    api.get<PaymentResponse>(`/donations/guardianship/${id}/pay`).then((r) => r.data),

  /** DEBUG: manually shift dates to generate invoices */
  debugTriggerBilling: (): Promise<void> =>
    api.post(`/donations/debug/trigger-billing`).then(() => undefined),

  /** My guardianships. GET /donations/my-guardianships */
  getMyGuardianships: (): Promise<VirtualGuardianship[]> =>
    api
      .get<GuardianshipDTO[]>('/donations/my-guardianships')
      .then((r) => r.data.map(mapGuardianship)),

  /**
   * Verify Stripe Checkout Session after redirect to /payment-success.
   * GET /donations/verify-session?session_id= -> { status: 'success' | 'pending' | 'failed' }.
   * The backend communicates directly with Stripe, so the result is real (not optimistic).
   */
  verifySession: (sessionId: string): Promise<{ status: PaymentVerificationStatus }> =>
    api
      .get<{ status: PaymentVerificationStatus }>('/donations/verify-session', {
        params: { session_id: sessionId },
      })
      .then((r) => r.data),
};
