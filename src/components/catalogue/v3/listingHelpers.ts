import type { ProductCard } from "@/lib/api";
import { formatPrice } from "@/data/catalogueData";

export type Sort = "featured" | "low" | "high" | "az";

export const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
  { value: "az", label: "Name: A to Z" },
];

/** Sort a copy of the list. "Featured" keeps the order the shop returns them in. */
export function sortProducts(products: ProductCard[], sort: Sort): ProductCard[] {
  const list = [...products];
  if (sort === "low") list.sort((a, b) => a.minPrice - b.minPrice);
  else if (sort === "high") list.sort((a, b) => b.minPrice - a.minPrice);
  else if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/** "₦4,500", or "from ₦1,100" when its variants are priced differently. Prices arrive in kobo. */
export function priceLabel(product: Pick<ProductCard, "minPrice" | "maxPrice">): string {
  const min = formatPrice(product.minPrice / 100);
  return product.maxPrice > product.minPrice ? `from ${min}` : min;
}
