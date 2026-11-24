import type { ProductDetail, ProductVariant } from "@/lib/api";
import { attrValue } from "@/lib/catalogueAdapter";

/** A variant she could switch a subscription to: on sale, and one we let people subscribe to. */
export const isChoosable = (variant: ProductVariant): boolean => variant.isActive && variant.isSubscribable;

/**
 * The product as far as buying it goes: only the variants on sale, and only the attribute values those use. The same
 * view as `choosableView`, without needing the variant to be subscribable.
 */
export function onSaleView(detail: ProductDetail): ProductDetail {
  return viewOf(detail, (variant) => variant.isActive);
}

function viewOf(detail: ProductDetail, keep: (variant: ProductVariant) => boolean): ProductDetail {
  const variants = detail.variants.filter(keep);
  const availableAttributes = Object.fromEntries(
    Object.entries(detail.availableAttributes).map(([name, values]) => [name, values.filter((value) => variants.some((v) => attrValue(v, name) === value))]),
  );
  return { ...detail, variants, availableAttributes };
}

/**
 * The product as far as a subscription is concerned: only the variants she can choose, and only the attribute
 * values those variants actually use (a size nobody can subscribe to is not offered). The order of the groups and
 * of the values inside them is the product's own, as on the product page.
 */
export function choosableView(detail: ProductDetail): ProductDetail {
  return viewOf(detail, isChoosable);
}

/** The attribute values a variant has, by attribute name: { Type: "jumbo", Size: "size-3" }. */
export function selectionOf(variant: ProductVariant | undefined): Record<string, string> {
  return Object.fromEntries((variant?.attributes ?? []).map((a) => [a.attributeName, a.value]));
}

/** Can this value be picked given what else is picked? (The same rule as the product page: some variant has both.) */
export function isAvailable(detail: ProductDetail, name: string, value: string, selected: Record<string, string>): boolean {
  const others = Object.entries(selected).filter(([key]) => key !== name);
  return detail.variants.some((variant) => attrValue(variant, name) === value && others.every(([key, chosen]) => attrValue(variant, key) === chosen));
}

/** The variant that matches every group she has picked in, if there is one. */
export function variantFor(detail: ProductDetail, selected: Record<string, string>): ProductVariant | undefined {
  return detail.variants.find((variant) =>
    Object.entries(detail.availableAttributes).every(([name, values]) => values.length === 0 || attrValue(variant, name) === selected[name]),
  );
}

/** "Pick the type and the size." */
export function pickText(names: string[]): string {
  return names.length ? `Pick the ${names.map((n) => n.toLowerCase()).join(" and the ")}.` : "";
}
