import type { OfferLine } from "@/lib/subscriptionBoxes";

/** "Kisskids Diapers, Baby wipes and 2 more". */
export function namesOf(lines: Array<Pick<OfferLine, "productName">>, shown = 2): string {
  const names = [...new Set(lines.map((l) => l.productName))];
  if (names.length <= shown) return names.join(names.length === 2 ? " and " : ", ");
  return `${names.slice(0, shown).join(", ")} and ${names.length - shown} more`;
}

/** What she would save each time, in kobo, if she subscribed to all of these. */
export function savingOf(lines: OfferLine[]): number {
  return lines.reduce((sum, l) => sum + (l.subscriptionPriceKobo && l.priceKobo > l.subscriptionPriceKobo ? (l.priceKobo - l.subscriptionPriceKobo) * l.quantity : 0), 0);
}

