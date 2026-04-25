import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWalletSummary, getWalletTransactions } from '@/lib/api';

type TxTypeFilter = 'credit' | 'debit' | undefined;

export function useWalletData(token: string | undefined, typeFilter?: TxTypeFilter) {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  const summary = useQuery({
    queryKey: ['wallet-summary', token],
    queryFn: () => getWalletSummary(token!),
    enabled: !!token,
    staleTime: 30_000,
  });

  const transactions = useQuery({
    queryKey: ['wallet-transactions', token, page, typeFilter ?? 'all'],
    queryFn: () => getWalletTransactions(token!, page, LIMIT, typeFilter),
    enabled: !!token,
    staleTime: 30_000,
  });

  const totalPages = transactions.data
    ? Math.ceil(transactions.data.total / LIMIT)
    : 0;

  const goToPage = useCallback((p: number) => setPage(p), []);

  return {
    summary: summary.data,
    summaryLoading: summary.isLoading,
    summaryError: summary.error,
    transactions: transactions.data?.transactions ?? [],
    transactionsTotal: transactions.data?.total ?? 0,
    transactionsLoading: transactions.isLoading,
    page,
    totalPages,
    goToPage,
    refetchSummary: summary.refetch,
  };
}
