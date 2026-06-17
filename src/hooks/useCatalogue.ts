/**
 * React Query hooks backing the redesigned shop/catalogue with live API data.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Full taxonomy tree: groups -> categories -> subcategories. */
export function useCategoryTree() {
  return useQuery({
    queryKey: ['catalogue', 'tree'],
    queryFn: () => api.getCategoryTree(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Products in a category (and optional subcategory). */
export function useCategoryProducts(params: {
  category?: string;
  subcategory?: string;
  enabled?: boolean;
}) {
  const { category, subcategory, enabled = true } = params;
  return useQuery({
    queryKey: ['catalogue', 'products', category ?? null, subcategory ?? null],
    queryFn: () =>
      api.getProducts({ category, subcategory, limit: 100 }),
    enabled: enabled && (!!category || !!subcategory),
  });
}

/** Product search by name/brand. */
export function useProductSearch(query: string, enabled = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['catalogue', 'search', trimmed],
    queryFn: () => api.getProducts({ search: trimmed, limit: 30 }),
    enabled: enabled && trimmed.length > 0,
  });
}

/** Full product detail (variants + attributes) by slug or id. */
export function useProductDetail(slugOrId: string | null | undefined) {
  return useQuery({
    queryKey: ['catalogue', 'product', slugOrId],
    queryFn: () => api.getProduct(slugOrId as string),
    enabled: !!slugOrId,
  });
}

/** The customer's recently purchased variants (buy-again). */
export function useRecentVariants(token: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['catalogue', 'recent-variants', token, limit],
    queryFn: () => api.getRecentVariants(token as string, limit),
    enabled: !!token,
  });
}
