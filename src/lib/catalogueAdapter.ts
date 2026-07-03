/**
 * Adapters that map the live API shapes (src/lib/api.ts) onto the
 * catalogue view-model shapes the redesigned shop components consume
 * (src/data/catalogueData.ts).
 *
 * Design note: the ProductVariant is the source of truth for price/stock.
 * `types[]`/`sizes[]` are derived from the product's "Type"/"Size" attribute
 * axes for selection; the concrete price comes from `resolveVariant()`, not
 * from a type.price + size.priceDelta decomposition.
 */
import type {
  ProductDetail,
  ProductVariant,
  ProductCard as ApiProductCard,
  Category as ApiCategory,
  CategoryGroup as ApiCategoryGroup,
} from '@/lib/api';
import type {
  CatalogueProduct,
  ProductAttribute,
  ProductType,
  ProductSizeOption,
  CatalogueCategory,
  CategoryGroup,
} from '@/data/catalogueData';

export const TYPE_ATTR = 'Type';
export const SIZE_ATTR = 'Size';

export function attrValue(variant: ProductVariant, attrName: string): string | undefined {
  return variant.attributes.find((a) => a.attributeName === attrName)?.value;
}

function displayName(
  detail: ProductDetail,
  attrName: string,
  value: string,
): string {
  for (const v of detail.variants) {
    const match = v.attributes.find(
      (a) => a.attributeName === attrName && a.value === value,
    );
    if (match) return match.displayValue || match.value;
  }
  return value;
}

/** Lowest variant price among variants carrying the given type value. */
function priceForType(detail: ProductDetail, typeValue: string): number {
  const prices = detail.variants
    .filter((v) => attrValue(v, TYPE_ATTR) === typeValue)
    .map((v) => v.price);
  return prices.length ? Math.min(...prices) : detail.minPrice;
}

/**
 * Resolve the concrete variant for a map of selected attribute values.
 * Matches ALL attribute axes present in availableAttributes.
 */
export function resolveVariant(
  detail: ProductDetail,
  selectedAttrs: Record<string, string>,
): ProductVariant | undefined {
  return detail.variants.find((v) =>
    Object.entries(detail.availableAttributes).every(([attrName, values]) => {
      if (!values.length) return true;
      return attrValue(v, attrName) === selectedAttrs[attrName];
    }),
  );
}

/** Map an API ProductDetail to the catalogue view-model product. */
export function apiProductToCatalogue(detail: ProductDetail): CatalogueProduct {
  const typeValues = detail.availableAttributes[TYPE_ATTR] ?? [];
  const sizeValues = detail.availableAttributes[SIZE_ATTR] ?? [];

  // When a product has no explicit Type axis, expose a single default type
  // so the selection UI still works and a variant can be resolved.
  const types: ProductType[] =
    typeValues.length > 0
      ? typeValues.map((value) => ({
          id: value,
          name: displayName(detail, TYPE_ATTR, value),
          price: priceForType(detail, value),
          description: undefined,
        }))
      : [
          {
            id: '__default__',
            name: 'Standard',
            price: detail.minPrice,
          },
        ];

  const sizes: ProductSizeOption[] | undefined =
    sizeValues.length > 0
      ? sizeValues.map((value) => {
          const label = displayName(detail, SIZE_ATTR, value);
          // displayValue may encode a weight range, e.g. "Size 3 · 5–9 kg"
          const [namePart, ...rest] = label.split('·');
          return {
            id: value,
            name: namePart.trim() || label,
            weightRange: rest.join('·').trim(),
            priceDelta: 0,
          };
        })
      : undefined;

  // Build a dynamic attribute list covering ALL axes in availableAttributes order.
  const attributes: ProductAttribute[] = Object.entries(detail.availableAttributes)
    .filter(([, values]) => values.length > 0)
    .map(([attrName, values]) => ({
      name: attrName,
      values: values.map((value) => ({
        id: value,
        name: displayName(detail, attrName, value),
      })),
    }));

  return {
    id: detail.id,
    name: detail.name,
    brand: detail.brand,
    categoryId: detail.categoryId,
    subcategoryId: detail.subcategoryId,
    image: detail.imageUrl,
    types,
    sizes,
    attributes,
  };
}

/**
 * Map a lightweight API ProductCard (list shape) onto the CatalogueProduct
 * view-model the redesigned list/card components consume.
 *
 * The card components only need identity, image and a min–max price RANGE.
 * We encode the range as two synthetic "types" (min and max) so the existing
 * `getProductPriceRange` helper renders "from ₦min" correctly. The product id
 * is reused as the detail lookup key (api.getProduct accepts slug OR id), and
 * the API slug is carried on `id` is avoided — callers needing the slug should
 * read it from the source ProductCard. Here we keep `id` = product id.
 */
export function apiCardToCatalogue(card: ApiProductCard): CatalogueProduct {
  const types: ProductType[] =
    card.minPrice === card.maxPrice
      ? [{ id: '_min', name: '', price: card.minPrice / 100 }]
      : [
          { id: '_min', name: '', price: card.minPrice / 100 },
          { id: '_max', name: '', price: card.maxPrice / 100 },
        ];
  return {
    id: card.id,
    name: card.name,
    brand: card.brand,
    categoryId: card.categoryId,
    subcategoryId: card.subcategoryId,
    image: card.imageUrl,
    types,
  };
}

/** Map an API category (from the tree) to the catalogue category view-model. */
export function apiCategoryToCatalogue(
  category: ApiCategory,
  groupId: string,
): CatalogueCategory {
  return {
    id: category.slug,
    name: category.displayName,
    displayName: category.displayName,
    groupId,
    iconKey: category.iconKey,
    tint: category.tint,
    imageUrl: category.imageUrl,
  };
}

/** Map an API category group to the catalogue group view-model. */
export function apiGroupToCatalogue(group: ApiCategoryGroup): CategoryGroup {
  return { id: group.slug, name: group.name };
}
