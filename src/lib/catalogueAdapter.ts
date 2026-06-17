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
  Category as ApiCategory,
  CategoryGroup as ApiCategoryGroup,
} from '@/lib/api';
import type {
  CatalogueProduct,
  ProductType,
  ProductSizeOption,
  CatalogueCategory,
  CategoryGroup,
} from '@/data/catalogueData';

export const TYPE_ATTR = 'Type';
export const SIZE_ATTR = 'Size';

function attrValue(variant: ProductVariant, attrName: string): string | undefined {
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
 * Resolve the concrete variant for a selected (type, size) pair.
 * Falls back gracefully when the product has only one axis (or none).
 */
export function resolveVariant(
  detail: ProductDetail,
  typeId: string | null,
  sizeId: string | null,
): ProductVariant | undefined {
  const hasType = (detail.availableAttributes[TYPE_ATTR]?.length ?? 0) > 0;
  const hasSize = (detail.availableAttributes[SIZE_ATTR]?.length ?? 0) > 0;
  return detail.variants.find((v) => {
    const typeOk = !hasType || attrValue(v, TYPE_ATTR) === typeId;
    const sizeOk = !hasSize || attrValue(v, SIZE_ATTR) === sizeId;
    return typeOk && sizeOk;
  });
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

  return {
    id: detail.id,
    name: detail.name,
    brand: detail.brand,
    categoryId: detail.categoryId,
    subcategoryId: detail.subcategoryId,
    image: detail.imageUrl,
    types,
    sizes,
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
  };
}

/** Map an API category group to the catalogue group view-model. */
export function apiGroupToCatalogue(group: ApiCategoryGroup): CategoryGroup {
  return { id: group.slug, name: group.name };
}
