/**
 * Gift catalogue view-model types + presentational metadata.
 *
 * Ported from the Lovable design's `giftBundleData.ts`, but the static
 * `giftPackages` array and the `@/assets/gifting/*.asset.json` imports have
 * been DROPPED — gift bundles are now sourced from the live API and mapped
 * onto this `GiftPackage` view-model by `src/lib/giftAdapter.ts`.
 *
 * Only the TYPES + presentational helpers (`giftCategoryMeta`, `tierGradient`,
 * `formatGiftPrice`) are kept here. They are pure/presentational and carry no
 * data dependency.
 */

export type GiftCategory = "baby" | "mom" | "combo";
export type GiftTier = "essentials" | "plus" | "premium";

export interface GiftPackageItem {
  name: string;
  detail: string;
  qty: string;
  emoji: string;
}

export interface GiftPackage {
  id: string; // bundle slug (round-trips to api.getBundle)
  category: GiftCategory;
  tier: GiftTier;
  name: string;
  tagline: string;
  description: string;
  /** Price in NAIRA (major units) — API totalPrice is divided by 100 by the adapter. */
  price: number;
  badge?: string; // "Most Loved", "Best Value", "Signature"
  heroImage: string;
  galleryImages: string[];
  items: GiftPackageItem[];
}

export const giftCategoryMeta: Record<
  GiftCategory,
  { label: string; short: string; subtitle: string; emoji: string; accent: string }
> = {
  baby: {
    label: "Baby",
    short: "Baby",
    subtitle: "For the littlest one",
    emoji: "👶",
    accent: "hsl(20, 55%, 70%)",
  },
  mom: {
    label: "Mom",
    short: "Mom",
    subtitle: "Pamper a new mama",
    emoji: "🌷",
    accent: "hsl(345, 55%, 72%)",
  },
  combo: {
    label: "Mom & Baby",
    short: "Combo",
    subtitle: "The complete duo",
    emoji: "🤍",
    accent: "hsl(85, 22%, 55%)",
  },
};

// Per-tier gradient pairs (mobile cards + drawer hero overlay)
export const tierGradient: Record<GiftCategory, Record<GiftTier, string>> = {
  baby: {
    essentials: "from-[hsl(28,55%,90%)] via-[hsl(30,40%,93%)] to-[hsl(25,35%,95%)]",
    plus: "from-[hsl(20,65%,82%)] via-[hsl(25,55%,88%)] to-[hsl(30,40%,94%)]",
    premium: "from-[hsl(18,60%,72%)] via-[hsl(22,55%,82%)] to-[hsl(28,50%,92%)]",
  },
  mom: {
    essentials: "from-[hsl(345,50%,92%)] via-[hsl(350,40%,94%)] to-[hsl(355,30%,96%)]",
    plus: "from-[hsl(340,60%,85%)] via-[hsl(345,50%,90%)] to-[hsl(350,40%,95%)]",
    premium: "from-[hsl(335,55%,72%)] via-[hsl(340,50%,82%)] to-[hsl(345,45%,92%)]",
  },
  combo: {
    essentials: "from-[hsl(85,28%,86%)] via-[hsl(80,22%,90%)] to-[hsl(75,18%,94%)]",
    plus: "from-[hsl(90,35%,78%)] via-[hsl(85,28%,86%)] to-[hsl(80,22%,93%)]",
    premium: "from-[hsl(95,32%,62%)] via-[hsl(88,28%,75%)] to-[hsl(82,22%,90%)]",
  },
};

/** Format a NAIRA (major-unit) amount. Bundle prices in this view-model are in naira. */
export function formatGiftPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/** Placeholder hero image used when a gift category has no imageUrl from the API. */
export const GIFT_BUNDLE_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80";
