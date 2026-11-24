import type { CartItem } from "@/contexts/CartContext";
import { legacyWeeks } from "@/lib/renewalFrequency";
import type { RenewalFrequency } from "@/lib/subscriptionBoxes";
import { weeksItLasts } from "@/lib/subscriptionFit";

/** What she chose for an item: how often, and for weekly the day of the first renewal. Not having one means one-time. */
export interface SubscribeChoice {
  frequency: RenewalFrequency;
  /** Weekly only: the day she wants the first renewal, "YYYY-MM-DD". */
  firstDate?: string;
}

/** The small uppercase label over a group on the Subscribe screens: "RENEWAL FREQUENCY", "FIRST RENEWAL". */
export const EYEBROW = "text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-shop-muted";

/** How far ahead the first renewal may be (the server's limit is the same 26 weeks). */
export const FIRST_RENEWAL_MAX_DAYS = 26 * 7;

const DEFAULT_WEEKS: RenewalFrequency = { kind: "weeks", every: 4 };

/** Where a choice starts: how long what she is buying lasts if we know, otherwise every 4 weeks. */
export function startingChoice(recommendedFrequencyWeeks: number | null | undefined, quantity: number): SubscribeChoice {
  const lasts = weeksItLasts(recommendedFrequencyWeeks, quantity);
  return { frequency: lasts === null ? DEFAULT_WEEKS : { kind: "weeks", every: lasts } };
}

/**
 * What the Subscribe card's choice does to a cart line. `null` is a one-time purchase: the fields are still
 * set (to "not a subscription"), so adding an item she had already put in the cart as a subscription replaces
 * that choice with this one, instead of silently keeping the old one.
 */
export function subscribeFields(choice: SubscribeChoice | null): Pick<CartItem, "isAutoRenew" | "frequencyWeeks" | "renewalFrequency" | "firstRenewalDate"> {
  if (!choice) return { isAutoRenew: false, frequencyWeeks: undefined, renewalFrequency: null, firstRenewalDate: undefined };
  return {
    isAutoRenew: true,
    frequencyWeeks: legacyWeeks(choice.frequency),
    renewalFrequency: choice.frequency,
    firstRenewalDate: choice.frequency.kind === "weeks" ? choice.firstDate : undefined,
  };
}
