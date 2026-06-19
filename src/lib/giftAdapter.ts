/**
 * Adapters that map the live gift-bundle API shapes (src/lib/api.ts) onto the
 * `GiftPackage` view-model the ported (Lovable) gifting components consume
 * (src/data/giftCatalogue.ts).
 *
 * Design notes:
 * - The grouped list endpoint (api.getBundles) gives identity + price but NO
 *   bundle items (its `categories[]` carry no products). Items come from the
 *   detail endpoint (api.getBundle).
 * - Prices: the gift-bundle + packaging-option API values are already in NAIRA
 *   (major units) — same convention as product variant prices (e.g. 6500 =
 *   ₦6,500). The GiftPackage view-model is also naira, so we pass them through
 *   as-is (no /100).
 * - Hero/gallery images: the API has no bundle imagery yet, so we fall back to
 *   the gift category's imageUrl, then to a constant placeholder. We never
 *   import `.asset.json` (those were Lovable-only and 404).
 */
import type {
  Bundle,
  BundleDetail,
  BundleDisplayItem,
  BundlesByGiftCategory,
  GiftCategorySummary,
  SizeSummary,
} from '@/lib/api';
import {
  GIFT_BUNDLE_PLACEHOLDER_IMAGE,
  type GiftCategory,
  type GiftPackage,
  type GiftPackageItem,
  type GiftTier,
} from '@/data/giftCatalogue';

/** Map a gift-category slug onto the view-model category. */
export function mapGiftCategory(slug: string | undefined): GiftCategory {
  switch ((slug ?? '').toLowerCase()) {
    case 'mom':
      return 'mom';
    case 'complete-set':
    case 'complete':
    case 'combo':
    case 'mom-baby':
    case 'mom-and-baby':
      return 'combo';
    case 'baby':
    default:
      return 'baby';
  }
}

/** Map a gift-package-size slug onto the view-model tier. */
export function mapGiftTier(slug: string | undefined): GiftTier {
  switch ((slug ?? '').toLowerCase()) {
    case 'medium':
      return 'plus';
    case 'large':
      return 'premium';
    case 'small':
    default:
      return 'essentials';
  }
}

/** Resolve a hero image for a bundle, falling back to category image then placeholder. */
function heroFor(category?: GiftCategorySummary): string {
  return category?.imageUrl || GIFT_BUNDLE_PLACEHOLDER_IMAGE;
}

/** Map the curated display-item list (verbatim copy) onto view-model items. */
function mapDisplayItems(items?: BundleDisplayItem[] | null): GiftPackageItem[] {
  return (items ?? []).map((it) => ({
    name: it.name,
    detail: it.detail ?? '',
    qty: it.qty ?? '',
    emoji: it.emoji ?? '',
  }));
}

/**
 * Map a list-shape Bundle (from api.getBundles) onto a GiftPackage.
 * NOTE: list bundles carry no items — `items` is left empty here. The detail
 * adapter (`apiBundleDetailToPackage`) fills them.
 */
export function apiBundleToPackage(
  bundle: Bundle,
  giftCategory: GiftCategorySummary,
): GiftPackage {
  const category = mapGiftCategory(giftCategory.slug);
  const tier = mapGiftTier(bundle.size?.slug);
  const hero = bundle.heroImageUrl || heroFor(giftCategory);
  return {
    id: bundle.slug || bundle.id,
    category,
    tier,
    name: bundle.name,
    tagline: bundle.tagline ?? bundle.size?.name ?? '',
    description: bundle.description ?? giftCategory.description ?? '',
    badge: bundle.badge ?? undefined,
    price: Math.round(bundle.totalPrice ?? 0),
    heroImage: hero,
    galleryImages: [hero, hero, hero],
    items: mapDisplayItems(bundle.items),
  };
}

/** Flatten the grouped bundles response into a list of GiftPackages. */
export function apiGroupedBundlesToPackages(
  groups: BundlesByGiftCategory[],
): GiftPackage[] {
  return groups.flatMap((g) =>
    (g.bundles ?? []).map((b) => apiBundleToPackage(b, g.giftCategory)),
  );
}

/** Map a bundle DETAIL (from api.getBundle) onto a fully-populated GiftPackage. */
export function apiBundleDetailToPackage(detail: BundleDetail): GiftPackage {
  const category = mapGiftCategory(detail.giftCategory?.slug);
  const tier = mapGiftTier(detail.size?.slug);
  const hero = detail.heroImageUrl || heroFor(detail.giftCategory);

  // Prefer the curated display items; fall back to deriving from real sections
  // for bundles that don't carry curated copy.
  const items: GiftPackageItem[] = detail.items?.length
    ? mapDisplayItems(detail.items)
    : (detail.categories ?? []).flatMap((cat) =>
        (cat.products ?? []).map((p) => ({
          name: p.variant?.product?.name ?? 'Item',
          qty: String(p.quantity ?? 1),
          detail: '',
          emoji: '',
        })),
      );

  return {
    id: detail.slug || detail.id,
    category,
    tier,
    name: detail.name,
    tagline: detail.tagline ?? detail.size?.name ?? '',
    description: detail.description ?? detail.giftCategory?.description ?? '',
    badge: detail.badge ?? undefined,
    price: Math.round(detail.priceOverride ?? detail.calculatedPrice ?? 0),
    heroImage: hero,
    galleryImages: [hero, hero, hero],
    items,
  };
}

/** Map an API packaging option onto the view-model PackagingOption used by the UI. */
export interface PackagingOption {
  id: string;
  name: string;
  description: string;
  /** Price in NAIRA (major units). */
  price: number;
  image: string;
}

export function apiPackagingToOption(opt: {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  sortOrder: number;
}): PackagingOption {
  return {
    id: opt.id,
    name: opt.name,
    description: opt.description ?? '',
    price: Math.round(opt.price ?? 0),
    image: opt.imageUrl || GIFT_BUNDLE_PLACEHOLDER_IMAGE,
  };
}

// Re-export for convenience where callers only need the size summary type.
export type { SizeSummary };
