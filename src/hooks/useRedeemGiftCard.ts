import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { redeemGiftCardToWallet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatKobo } from '@/utils/wallet';

export interface RedeemResult {
  amount: number;
  balance: number;
}

/**
 * Owns the full "redeem a gift card into the wallet" flow: the code input,
 * the mutation, success result, and error state. On success it credits the
 * wallet, refreshes every wallet view, and toasts. Consumers only render.
 */
export function useRedeemGiftCard() {
  const queryClient = useQueryClient();
  const { session, refreshWalletBalance } = useAuth();
  const token = session?.access_token;

  const [code, setCode] = useState('');
  const [result, setResult] = useState<RedeemResult | null>(null);

  const mutation = useMutation({
    mutationFn: (rawCode: string) => {
      if (!token) throw new Error('Please sign in to redeem a gift card.');
      return redeemGiftCardToWallet(rawCode.trim(), token);
    },
    onSuccess: async (data) => {
      setResult({ amount: data.redeemedAmount, balance: data.walletBalance });
      toast.success(`${formatKobo(data.redeemedAmount)} added to your wallet`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-balance'] }),
      ]);
      await refreshWalletBalance();
    },
  });

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate(trimmed);
  };

  const reset = () => {
    setCode('');
    setResult(null);
    mutation.reset();
  };

  return {
    code,
    setCode,
    result,
    submit,
    reset,
    clearError: () => mutation.reset(),
    isPending: mutation.isPending,
    error: mutation.isError ? mutation.error.message : null,
  };
}
