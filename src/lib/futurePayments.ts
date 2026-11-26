import type { CartItem } from "@/contexts/CartContext";
import { describeFrequency, legacyWeeks } from "@/lib/renewalFrequency";
import { formatDay } from "@/lib/subscriptionBoxes";

export interface FuturePayment {
  key: string;
  /** "On the 25th of every month", "Every 3 weeks, from Tue 1 Dec"; for an old-style line, "In 4 weeks". */
  label: string;
  /** Kobo: what the lines on this schedule cost each time, at the subscription price. */
  amount: number;
}

/**
 * The "Future payments" lines in the cart and at checkout: the subscribed lines, grouped by when they renew. A line
 * with the new Subscribe choice says what she chose, as its cart row does (a monthly choice is not "In 4 weeks"); an
 * old-style line still says "In N weeks".
 */
export function futurePayments(items: CartItem[]): FuturePayment[] {
  const groups = new Map<string, FuturePayment & { order: number }>();
  for (const item of items) {
    if (!item.isAutoRenew || (!item.renewalFrequency && !item.frequencyWeeks)) continue;
    const amount = (item.subscriptionPrice || item.unitPrice) * item.quantity;
    let key: string;
    let label: string;
    let order: number;
    if (item.renewalFrequency) {
      const from = item.renewalFrequency.kind === "weeks" && item.firstRenewalDate ? item.firstRenewalDate : null;
      key = `${JSON.stringify(item.renewalFrequency)}|${from ?? ""}`;
      label = from ? `${describeFrequency(item.renewalFrequency)}, from ${formatDay(from)}` : describeFrequency(item.renewalFrequency);
      order = legacyWeeks(item.renewalFrequency);
    } else {
      const weeks = item.frequencyWeeks as number;
      key = `weeks:${weeks}`;
      label = `In ${weeks} week${weeks === 1 ? "" : "s"}`;
      order = weeks;
    }
    const group = groups.get(key);
    if (group) group.amount += amount;
    else groups.set(key, { key, label, amount, order });
  }
  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ key, label, amount }) => ({ key, label, amount }));
}
