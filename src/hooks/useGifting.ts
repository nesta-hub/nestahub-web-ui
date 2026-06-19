/**
 * React Query hooks backing the redesigned (v2) gifting experience with live
 * API data. Mirrors src/hooks/useCatalogue.ts.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  apiBundleDetailToPackage,
  apiGroupedBundlesToPackages,
  apiPackagingToOption,
  type PackagingOption,
} from '@/lib/giftAdapter';
import type { GiftPackage } from '@/data/giftCatalogue';

/**
 * All gift bundles, flattened from the grouped API response into
 * GiftPackage[]. Items are NOT populated here (the list endpoint omits them);
 * use `useGiftBundle` for a bundle's item list.
 */
export function useGiftBundles() {
  return useQuery<GiftPackage[]>({
    queryKey: ['gifting', 'bundles'],
    queryFn: async () => {
      const res = await api.getBundles();
      return apiGroupedBundlesToPackages(res.giftCategories ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * A single gift bundle's detail (with items), keyed by slug or id.
 * Returns the GiftPackage view-model PLUS the raw API bundle id (`bundleId`),
 * which is what createOrder({ orderType: 'bundle', bundleId }) requires.
 */
export function useGiftBundle(idOrSlug: string | null | undefined) {
  return useQuery<{ pkg: GiftPackage; bundleId: string }>({
    queryKey: ['gifting', 'bundle', idOrSlug],
    queryFn: async () => {
      const detail = await api.getBundle(idOrSlug as string);
      return { pkg: apiBundleDetailToPackage(detail), bundleId: detail.id };
    },
    enabled: !!idOrSlug,
  });
}

/** Active packaging add-ons (Signature Box / Gift Bag, etc.). */
export function usePackagingOptions() {
  return useQuery<PackagingOption[]>({
    queryKey: ['gifting', 'packaging-options'],
    queryFn: async () => {
      const opts = await api.getPackagingOptions();
      return [...opts]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(apiPackagingToOption);
    },
    staleTime: 5 * 60 * 1000,
  });
}
