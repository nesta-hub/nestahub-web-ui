import { BOX_CODES, BoxApiError, type CatalogItem, type EnrolInput } from "@/lib/subscriptionBoxes";
import type { SubscribeChoice } from "@/components/subscribe-card/choice";
import type { ProductDetail } from "@/lib/api";
import { attrValue } from "@/lib/catalogueAdapter";

/** What she would pay for one, and the regular price to strike through beside it (only when the subscription price is lower). */
export function priceFor(item: Pick<CatalogItem, "priceKobo" | "subscriptionPriceKobo">): { payKobo: number; wasKobo: number | null } {
  const sub = item.subscriptionPriceKobo;
  if (sub && sub < item.priceKobo) return { payKobo: sub, wasKobo: item.priceKobo };
  return { payKobo: item.priceKobo, wasKobo: null };
}

/** Does this item match what she typed? Every word she typed must be in the name, the brand or the size, in any case. */
export function matchesSearch(item: Pick<CatalogItem, "productName" | "brand" | "variantLabel">, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = [item.productName, item.brand, item.variantLabel].filter(Boolean).join(" ").toLowerCase();
  return words.every((word) => text.includes(word));
}

/** The body the API wants: the day of her first order goes with any frequency. */
export function enrolInput(item: Pick<CatalogItem, "variantId">, quantity: number, choice: SubscribeChoice): EnrolInput {
  const input: EnrolInput = { variantId: item.variantId, quantity, frequency: choice.frequency };
  if (choice.firstDate) input.firstDate = choice.firstDate;
  return input;
}

export const GENERIC_FAILURE = "Something went wrong. Please try again.";

/** What to say when subscribing did not work, and whether it is because she already subscribes to it. */
export function describeEnrolFailure(error: unknown): { message: string; alreadySubscribed: boolean } {
  if (error instanceof BoxApiError) {
    if (error.code === BOX_CODES.alreadySubscribed) return { message: "You already subscribe to this one.", alreadySubscribed: true };
    if (error.code === BOX_CODES.itemNotAvailable) return { message: "That item can't be subscribed to right now.", alreadySubscribed: false };
    return { message: error.message || GENERIC_FAILURE, alreadySubscribed: false };
  }
  // A network failure's own words ("Failed to fetch") mean nothing to her.
  return { message: GENERIC_FAILURE, alreadySubscribed: false };
}

/** One product on the page: its tile stands for every size of it she can subscribe to. */
export interface CatalogProduct {
  productId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  /** Its sizes she can subscribe to, in the list's order. */
  items: CatalogItem[];
  /** The least she would pay for one. */
  fromKobo: number;
  /** Do its sizes cost different amounts? Then the price reads "From". */
  pricesDiffer: boolean;
  /** She already subscribes to one of its sizes. */
  subscribed: boolean;
}

export interface CatalogSection {
  id: string;
  name: string;
  products: CatalogProduct[];
}

/**
 * The list as the page shows it: a row for each category, in the categories' own order, with a tile for each product.
 * Anything whose category we were not told about goes in a last row, "Other".
 */
export function groupCatalog(items: CatalogItem[], categories: Array<{ id: string; name: string }>): CatalogSection[] {
  const byProduct = new Map<string, CatalogItem[]>();
  for (const item of items) byProduct.set(item.productId, [...(byProduct.get(item.productId) ?? []), item]);

  const known = new Set(categories.map((c) => c.id));
  const sections = new Map<string, CatalogSection>([...categories.map((c): [string, CatalogSection] => [c.id, { id: c.id, name: c.name, products: [] }])]);
  for (const group of byProduct.values()) {
    const first = group[0];
    const key = first.categoryId && known.has(first.categoryId) ? first.categoryId : "other";
    if (!sections.has(key)) sections.set(key, { id: key, name: "Other", products: [] });
    const pays = group.map((item) => priceFor(item).payKobo);
    sections.get(key)?.products.push({
      productId: first.productId,
      name: first.productName,
      brand: first.brand,
      imageUrl: group.find((item) => item.imageUrl)?.imageUrl ?? null,
      items: group,
      fromKobo: Math.min(...pays),
      pricesDiffer: new Set(pays).size > 1,
      subscribed: group.some((item) => item.subscribed),
    });
  }
  return [...sections.values()].filter((section) => section.products.length > 0);
}

/** The product with only the variants in her list, and only the Type and Size values those use. */
export function subscribableView(detail: ProductDetail, variantIds: ReadonlySet<string>): ProductDetail {
  const variants = detail.variants.filter((variant) => variant.isActive && variantIds.has(variant.id));
  const availableAttributes = Object.fromEntries(
    Object.entries(detail.availableAttributes).map(([name, values]) => [name, values.filter((value) => variants.some((v) => attrValue(v, name) === value))]),
  );
  return { ...detail, variants, availableAttributes };
}
