import type { Category, CategoryGroup, CategoryTreeResponse } from "@/lib/api";

export interface ShopTarget {
  /** The group to show: the category's own when there is a category, else the one in the address. */
  group: CategoryGroup | null;
  category: Category | null;
}

/**
 * What a shop link (/shop/:group or /shop/:group/:category) points at.
 *
 * Category slugs are unique across the shop, so a category is found by its own slug wherever it
 * lives now. A link shared before the category moved to another group still works, and so does
 * one to a category with no group (/shop/all/:category, as the admin's Copy link builds it in
 * admin-ui/src/lib/shop-link.ts).
 */
export function findShopTarget(
  tree: Partial<CategoryTreeResponse> | undefined,
  groupSlug?: string,
  categorySlug?: string,
): ShopTarget {
  const groups = tree?.groups ?? [];
  if (categorySlug) {
    for (const group of groups) {
      const category = group.categories.find((c) => c.slug === categorySlug);
      if (category) return { group, category };
    }
    const loose = tree?.ungrouped?.find((c) => c.slug === categorySlug);
    if (loose) return { group: null, category: loose };
  }
  return { group: groups.find((g) => g.slug === groupSlug) ?? null, category: null };
}
