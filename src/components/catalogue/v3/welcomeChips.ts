import type { MyOrder } from "@/lib/api";
import { formatDeliveryDayShort } from "@/lib/delivery-choice";
import { formatKobo } from "@/utils/wallet";

/**
 * What the signed-in welcome card says under the greeting and the wallet balance: up to
 * two short chips, the most pressing first. Pure, so the order of importance is easy to test.
 *
 *   1  an order is waiting for your payment          "Pay ₦12,400"
 *   2  a paid order is due today (else tomorrow)     "Delivery today"
 *   3  something is in the cart                      "2 in your cart"
 *   4  any other active order                        "Delivery Fri 6 Nov" / "Verifying payment"
 */

export type WelcomeChipKind = "pay" | "delivery" | "cart" | "order";

/** Where tapping a chip goes: the cart drawer, or the orders page (opening one order if named). */
export type WelcomeChipTarget =
  | { type: "cart" }
  | { type: "orders"; orderNumber?: string; /** Open that order's payment screen straight away. */ pay?: boolean };

export interface WelcomeChip {
  kind: WelcomeChipKind;
  label: string;
  target: WelcomeChipTarget;
}

export const MAX_WELCOME_CHIPS = 2;

/** The statuses of an order that is still on its way to the customer. */
const ACTIVE_STATUSES = new Set(["order_submitted", "payment_made", "processing"]);

/** Waiting for the buyer's own payment (not pay on delivery, not a transfer already reported). */
const needsPayment = (o: MyOrder) => o.status === "order_submitted" && o.canConfirmPayment;

/** Paid for, or to be paid on delivery: its delivery day is a real promise. */
const isSettled = (o: MyOrder) => o.status === "processing" || (o.status === "order_submitted" && !o.canConfirmPayment);

/** "2026-10-31" for the Lagos calendar day that `now` falls on (Lagos is UTC+1, with no daylight saving). */
export function lagosDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The day after a "YYYY-MM-DD" day, in the same form. */
export function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** "Sade" from "Sade Adeyemi"; null when there is no name to greet. */
export function firstNameOf(full: string | null | undefined): string | null {
  return full?.trim().split(/\s+/)[0] || null;
}

function describeOrder(order: MyOrder, today: string): string {
  if (order.status === "payment_made") return "Verifying payment";
  const date = order.scheduledDeliveryDate;
  // A promised day that has already gone by says nothing useful; the order is simply still being got ready.
  if (date && date >= today) {
    const day = formatDeliveryDayShort(date);
    if (day) return `Delivery ${day}`;
  }
  return "Order being prepared";
}

interface Input {
  orders: MyOrder[];
  /** How many items are in the cart. */
  cartCount: number;
  /** Today in Lagos, "YYYY-MM-DD" (see `lagosDay`). */
  today: string;
}

export function pickWelcomeChips({ orders, cartCount, today }: Input): WelcomeChip[] {
  const chips: WelcomeChip[] = [];
  const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status));

  // 1. An order is waiting for payment.
  const unpaid = active.filter(needsPayment);
  if (unpaid.length === 1) {
    const [order] = unpaid;
    chips.push({
      kind: "pay",
      label: `Pay ${formatKobo(order.totalAmount)}`,
      target: { type: "orders", orderNumber: order.orderNumber, pay: true },
    });
  } else if (unpaid.length > 1) {
    chips.push({ kind: "pay", label: `Pay for ${unpaid.length} orders`, target: { type: "orders" } });
  }

  // 2. A paid order is due today, or failing that tomorrow.
  const settled = active.filter((o) => !needsPayment(o) && isSettled(o));
  const tomorrow = nextDay(today);
  const dueToday = settled.filter((o) => o.scheduledDeliveryDate === today);
  const dueTomorrow = settled.filter((o) => o.scheduledDeliveryDate === tomorrow);
  const due = dueToday.length > 0 ? dueToday : dueTomorrow;
  const when = dueToday.length > 0 ? "today" : "tomorrow";
  if (due.length === 1) {
    chips.push({ kind: "delivery", label: `Delivery ${when}`, target: { type: "orders", orderNumber: due[0].orderNumber } });
  } else if (due.length > 1) {
    chips.push({ kind: "delivery", label: `${due.length} deliveries ${when}`, target: { type: "orders" } });
  }

  // 3. Something is in the cart.
  if (cartCount > 0) {
    chips.push({ kind: "cart", label: `${cartCount} in your cart`, target: { type: "cart" } });
  }

  // 4. Any other active order: the ones not already named above.
  const named = new Set([...unpaid, ...due].map((o) => o.orderNumber));
  const rest = active.filter((o) => !named.has(o.orderNumber));
  if (rest.length === 1) {
    chips.push({ kind: "order", label: describeOrder(rest[0], today), target: { type: "orders", orderNumber: rest[0].orderNumber } });
  } else if (rest.length > 1) {
    chips.push({ kind: "order", label: `${rest.length} active orders`, target: { type: "orders" } });
  }

  return chips.slice(0, MAX_WELCOME_CHIPS);
}
