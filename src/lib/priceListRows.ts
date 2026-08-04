/**
 * Transforms for the public /prices page: turn the API price list into flat,
 * searchable rows grouped by category.
 */
import type { PriceListResponse } from "@/lib/api";
import type { PriceVariantRow } from "@/components/prices/PriceRow";

export interface PriceCategoryBlock {
  id: string;
  name: string;
  rows: PriceVariantRow[];
}

/**
 * Flatten categories -> products -> variants into one row per variant.
 *
 * A product with a single unlabelled variant (no attributes) still gets a row;
 * its variant cell is simply blank rather than showing a bare SKU.
 */
export function buildCategoryBlocks(
  data: PriceListResponse | undefined,
): PriceCategoryBlock[] {
  if (!data) return [];

  return data.categories
    .map((category) => {
      const rows: PriceVariantRow[] = [];

      category.products.forEach((product) => {
        product.variants.forEach((variant) => {
          rows.push({
            key: variant.id,
            image: product.imageUrl,
            title: `${product.brand} ${product.name}`.trim(),
            variant: variant.label,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
          });
        });
      });

      return { id: category.id, name: category.name, rows };
    })
    .filter((block) => block.rows.length > 0);
}

/**
 * Filter blocks by a free-text query across category, product and variant text.
 *
 * A match on the category name keeps the whole category, so searching "wipes"
 * shows everything under Wipes rather than only rows with "wipes" in the title.
 */
export function filterCategoryBlocks(
  blocks: PriceCategoryBlock[],
  query: string,
): PriceCategoryBlock[] {
  const q = query.trim().toLowerCase();
  if (!q) return blocks;

  return blocks
    .map((block) => ({
      ...block,
      rows: block.name.toLowerCase().includes(q)
        ? block.rows
        : block.rows.filter(
            (row) =>
              row.title.toLowerCase().includes(q) ||
              row.variant.toLowerCase().includes(q),
          ),
    }))
    .filter((block) => block.rows.length > 0);
}

/** "Updated August 2026" — from the catalogue's real last-changed date. */
export function formatUpdatedLabel(updatedAt: string | undefined): string {
  const date = updatedAt ? new Date(updatedAt) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}
