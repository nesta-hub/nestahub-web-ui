import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ReferralHistoryEntry {
  id: string;
  type: 'earned' | 'converted' | 'redeemed';
  points: number;
  label: string;
  createdAt: string;
}

export interface ReferralLookupData {
  code: string;
  name: string | null;
  points: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  history: ReferralHistoryEntry[];
}

async function fetchReferralLookup(code: string): Promise<ReferralLookupData> {
  const res = await fetch(`${API_BASE_URL}/referrals/lookup/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Referral code not found');
  }
  return res.json();
}

export function useReferralLookup(code: string | undefined) {
  return useQuery({
    queryKey: ['referral-lookup', code],
    queryFn: () => fetchReferralLookup(code!),
    enabled: !!code,
    staleTime: 30_000,
    retry: false,
  });
}
