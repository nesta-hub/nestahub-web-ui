import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redeemGiftCardToWallet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PENDING_KEY = 'pending_gift_redeem';

/**
 * Drives the "Add to my wallet" action on the recipient gift page.
 *
 * - Signed in  → redeems the card's code into the wallet immediately.
 * - Signed out → stashes the redeem intent + return URL, kicks off Google
 *   sign-in, and (via AuthCallback's auth_redirect_url) lands the user back on
 *   this gift page, where the intent is picked up and the redeem auto-runs.
 *
 * On success it refreshes every wallet view so the balance reflects the credit.
 */
export function useAddGiftToWallet(giftId: string, giftCode: string) {
  const { user, session, signInWithGoogle, refreshWalletBalance } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const token = session?.access_token;
      if (!token) throw new Error('Please sign in to add this gift to your wallet.');
      return redeemGiftCardToWallet(giftCode.trim(), token);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-balance'] }),
      ]);
      await refreshWalletBalance();
    },
  });

  // Returning from sign-in with a pending intent for this card → auto-redeem.
  useEffect(() => {
    if (user && localStorage.getItem(PENDING_KEY) === giftId) {
      localStorage.removeItem(PENDING_KEY);
      mutation.mutate();
    }
    // Only re-run when auth or the card changes; mutation is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, giftId]);

  const addToWallet = () => {
    if (mutation.isPending || mutation.isSuccess) return;
    if (user) {
      mutation.mutate();
      return;
    }
    // Not signed in — remember where to come back to and what to redeem.
    localStorage.setItem('auth_redirect_url', window.location.pathname);
    localStorage.setItem(PENDING_KEY, giftId);
    signInWithGoogle().catch(() => localStorage.removeItem(PENDING_KEY));
  };

  return {
    addToWallet,
    isLoggedIn: !!user,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    redeemedAmount: mutation.data?.redeemedAmount ?? null,
    walletBalance: mutation.data?.walletBalance ?? null,
    error: mutation.isError ? (mutation.error as Error).message : null,
  };
}
