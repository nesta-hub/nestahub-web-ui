import type { CatalogItem, OfferLine } from "@/lib/subscriptionBoxes";
import { weeksItLasts } from "@/lib/subscriptionFit";

/** How many of the things she buys often to show. The rest are one tap away on "Subscribe to something else". */
export const MAX_SHOWN = 4;

/** An offer line, as the subscribe sheet wants an item. */
export function asCatalogItem(line: OfferLine): CatalogItem {
  return {
    variantId: line.variantId,
    productId: "",
    productName: line.productName,
    brand: line.brand,
    slug: null,
    variantLabel: line.variantLabel,
    imageUrl: line.imageUrl,
    categoryId: null,
    priceKobo: line.priceKobo,
    subscriptionPriceKobo: line.subscriptionPriceKobo,
    recommendedFrequencyWeeks: line.recommendedFrequencyWeeks,
    subscribed: false,
  };
}

/** "Bought 3 times · lasts about 2 weeks": what she has been buying, and how long one order of it lasts. Parts we do not know are left out. */
export function boughtLine(line: Pick<OfferLine, "timesBought" | "recommendedFrequencyWeeks" | "quantity">): string {
  const times = line.timesBought === null ? null : line.timesBought === 1 ? "Bought once" : `Bought ${line.timesBought} times`;
  const weeks = weeksItLasts(line.recommendedFrequencyWeeks, line.quantity);
  const lasts = weeks === null ? null : `lasts about ${weeks === 1 ? "a week" : `${weeks} weeks`}`;
  return [times, lasts].filter(Boolean).join(" · ");
}
