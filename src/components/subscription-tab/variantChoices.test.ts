import { describe, expect, it } from "vitest";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import { choosableView, isAvailable, isChoosable, pickText, selectionOf, variantFor } from "./variantChoices";

const variant = (id: string, type: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  id, sku: id, price: 500_000, stock: 5, isInStock: true, isSubscribable: true, isActive: true,
  attributes: [
    { attributeName: "Type", attributeSlug: "type", value: type, displayValue: type, sortOrder: 0 },
    { attributeName: "Size", attributeSlug: "size", value: size, displayValue: size, sortOrder: 1 },
  ],
  ...over,
});

const detail = (variants: ProductVariant[], availableAttributes: Record<string, string[]>): ProductDetail =>
  ({ id: "p1", name: "Diapers", brand: "Kisskids", slug: "diapers", variants, availableAttributes } as unknown as ProductDetail);

const ALL = detail(
  [
    variant("small-2", "small", "size-2"),
    variant("small-3", "small", "size-3"),
    variant("jumbo-3", "jumbo", "size-3"),
    variant("jumbo-4", "jumbo", "size-4"),
    variant("eco-3", "eco", "size-3", { isSubscribable: false }), // cannot be subscribed to
    variant("eco-5", "eco", "size-5", { isActive: false }), // off sale
  ],
  { Type: ["small", "eco", "jumbo"], Size: ["size-2", "size-3", "size-4", "size-5"] },
);

describe("isChoosable", () => {
  it("needs the variant to be on sale and subscribable", () => {
    expect(isChoosable(variant("a", "x", "y"))).toBe(true);
    expect(isChoosable(variant("a", "x", "y", { isSubscribable: false }))).toBe(false);
    expect(isChoosable(variant("a", "x", "y", { isActive: false }))).toBe(false);
  });
});

describe("choosableView", () => {
  const view = choosableView(ALL);

  it("keeps only the variants she can choose", () => {
    expect(view.variants.map((v) => v.id)).toEqual(["small-2", "small-3", "jumbo-3", "jumbo-4"]);
  });

  it("offers only the values those variants use, in the product's own order (no 'eco', no 'size-5')", () => {
    expect(view.availableAttributes).toEqual({ Type: ["small", "jumbo"], Size: ["size-2", "size-3", "size-4"] });
  });

  it("leaves the product itself alone", () => {
    expect(ALL.variants).toHaveLength(6);
    expect(ALL.availableAttributes.Type).toEqual(["small", "eco", "jumbo"]);
  });

  it("a product with one thing that varies has one group", () => {
    const wipes = detail([variant("w1", "single", "10 sheets"), variant("w2", "single", "80 sheets")].map((v) => ({ ...v, attributes: [v.attributes[1]] })), { Size: ["10 sheets", "80 sheets"] });
    expect(choosableView(wipes).availableAttributes).toEqual({ Size: ["10 sheets", "80 sheets"] });
  });
});

describe("selectionOf", () => {
  it("is what a variant has in each group", () => {
    expect(selectionOf(ALL.variants[3])).toEqual({ Type: "jumbo", Size: "size-4" });
  });
  it("is nothing for no variant", () => {
    expect(selectionOf(undefined)).toEqual({});
  });
});

describe("isAvailable", () => {
  const view = choosableView(ALL);

  it("a value goes with what else is picked only if some variant has both", () => {
    // Small comes in sizes 2 and 3; Jumbo in 3 and 4.
    expect(isAvailable(view, "Size", "size-2", { Type: "small", Size: "size-3" })).toBe(true);
    expect(isAvailable(view, "Size", "size-4", { Type: "small", Size: "size-3" })).toBe(false);
    expect(isAvailable(view, "Size", "size-4", { Type: "jumbo", Size: "size-3" })).toBe(true);
  });

  it("looks at the other groups only, not the value already picked in this one", () => {
    expect(isAvailable(view, "Type", "jumbo", { Type: "small", Size: "size-3" })).toBe(true); // Jumbo has a size 3
    expect(isAvailable(view, "Type", "jumbo", { Type: "small", Size: "size-2" })).toBe(false); // but no size 2
  });

  it("everything is available while nothing else is picked", () => {
    expect(isAvailable(view, "Type", "jumbo", {})).toBe(true);
  });
});

describe("variantFor", () => {
  const view = choosableView(ALL);
  it("finds the variant that matches every group", () => {
    expect(variantFor(view, { Type: "jumbo", Size: "size-4" })?.id).toBe("jumbo-4");
    expect(variantFor(view, { Type: "small", Size: "size-2" })?.id).toBe("small-2");
  });
  it("finds nothing for a combination that does not exist, or while a group is not picked", () => {
    expect(variantFor(view, { Type: "small", Size: "size-4" })).toBeUndefined();
    expect(variantFor(view, { Type: "small" })).toBeUndefined();
    expect(variantFor(view, {})).toBeUndefined();
  });
});

describe("pickText", () => {
  it("names what she picks", () => {
    expect(pickText(["Type", "Size"])).toBe("Pick the type and the size.");
    expect(pickText(["Size"])).toBe("Pick the size.");
    expect(pickText([])).toBe("");
  });
});
