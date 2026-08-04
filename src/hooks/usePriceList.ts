/**
 * React Query hook backing the public /prices page.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * The full public price list, grouped by category.
 *
 * The payload is identical for every visitor and the API caches it for 5
 * minutes, so this mirrors that staleTime rather than refetching per mount.
 */
export function usePriceList() {
  return useQuery({
    queryKey: ['price-list'],
    queryFn: () => api.getPriceList(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
