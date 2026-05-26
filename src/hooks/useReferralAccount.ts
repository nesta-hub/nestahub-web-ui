import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ReferralAccountData {
  referralCode: string | null;
  points: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  history: {
    id: string;
    type: 'earned' | 'converted' | 'redeemed';
    points: number;
    label: string;
    createdAt: string;
  }[];
}

async function fetchReferralAccount(token: string): Promise<ReferralAccountData> {
  // Get base stats from existing wallet endpoint
  const statsRes = await fetch(`${API_BASE_URL}/wallet/referral`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!statsRes.ok) throw new Error('Failed to load referral info');
  const stats = await statsRes.json();

  // If user has a code, fetch full lookup (history + points)
  if (stats.referralCode) {
    const lookupRes = await fetch(
      `${API_BASE_URL}/referrals/lookup/${encodeURIComponent(stats.referralCode)}`,
    );
    if (lookupRes.ok) {
      const lookup = await lookupRes.json();
      return {
        referralCode: stats.referralCode,
        points: lookup.points,
        totalReferrals: lookup.totalReferrals,
        completedReferrals: lookup.completedReferrals,
        pendingReferrals: lookup.pendingReferrals,
        history: lookup.history,
      };
    }
  }

  return {
    referralCode: stats.referralCode ?? null,
    points: 0,
    totalReferrals: stats.totalReferrals ?? 0,
    completedReferrals: stats.completedReferrals ?? 0,
    pendingReferrals: stats.pendingReferrals ?? 0,
    history: [],
  };
}

export function useReferralAccount() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['referral-account', token],
    queryFn: () => fetchReferralAccount(token!),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useConvertPoints() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (points: number) => {
      const res = await fetch(`${API_BASE_URL}/referrals/convert-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ points }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to convert points');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-account'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });
}

export function useRequestGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      code: string;
      rewardId: string;
      rewardName: string;
      pointsRequired: number;
    }) => {
      const res = await fetch(`${API_BASE_URL}/referrals/request-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit gift request');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['referral-account'] });
      queryClient.invalidateQueries({ queryKey: ['referral-lookup', variables.code] });
    },
  });
}

export async function registerReferrer(body: {
  name: string;
  email: string;
  phone?: string;
  source?: string;
}): Promise<{ referralCode: string; id: string; isExisting: boolean }> {
  const res = await fetch(`${API_BASE_URL}/referrals/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Registration failed');
  }
  return res.json();
}
