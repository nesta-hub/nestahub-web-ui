import type { Category, CategoryGroup } from "@/lib/api";

/** A category as the tree endpoint returns it. */
export const category = (slug: string, displayName = slug, over: Partial<Category> = {}): Category => ({
  id: `cat-${slug}`,
  name: displayName,
  displayName,
  slug,
  imageUrl: `https://img.test/${slug}.jpg`,
  sortOrder: 0,
  productCount: 3,
  isActive: true,
  subcategories: [],
  ...over,
});

export const group = (slug: string, name: string, categories: Category[], sortOrder = 0): CategoryGroup => ({
  id: `grp-${slug}`,
  name,
  slug,
  sortOrder,
  categories,
});

/** Three of the real groups, with their real slugs and (as saved) a trailing space on two names. */
export const TREE: CategoryGroup[] = [
  group("baby-care", "Body Care", [category("diaper-collectibles", "Diaper Collectibles"), category("body-wash", "Body Wash")], 0),
  group("health-wellness", "Health & Oral Care", [category("thermometer", "Thermometer")], 2),
  group("back-to-school", "Learning Resource ", [category("ring-stack", "Ring Stack"), category("flash-cards", "Flash Cards")], 6),
];

/** A group with `n` categories named c1..cn. */
export const groupOf = (slug: string, name: string, n: number): CategoryGroup =>
  group(slug, name, Array.from({ length: n }, (_, i) => category(`${slug}-c${i + 1}`, `Category ${i + 1}`)));

/** A product card as the products endpoint returns it. Prices are in kobo. */
export const product = (slug: string, name: string, minPrice: number, over: Partial<import("@/lib/api").ProductCard> = {}): import("@/lib/api").ProductCard => ({
  id: `p-${slug}`,
  name,
  brand: "Brand",
  slug,
  imageUrl: `https://img.test/${slug}.jpg`,
  categoryId: "cat",
  categoryName: "Cat",
  categoryDisplayName: "Cat",
  categorySlug: "cat",
  minPrice,
  maxPrice: minPrice,
  variantCount: 1,
  isInStock: true,
  isActive: true,
  ...over,
});
