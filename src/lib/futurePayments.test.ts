import { describe, expect, it } from "vitest";
import type { CartItem } from "@/contexts/CartContext";
import { futurePayments } from "./futurePayments";

const item = (over: Partial<CartItem>): CartItem =>
  ({ variantId: "v1", productId: "p1", productName: "Baby wipes", brand: "Kisskids", unitPrice: 1_625_000, quantity: 1, isAutoRenew: true, ...over }) as CartItem;

describe("future payments in the cart and at checkout", () => {
  it("a monthly choice says what she chose, not 'In 4 weeks'", () => {
    expect(futurePayments([item({ frequencyWeeks: 4, renewalFrequency: { kind: "month_date", day: 25 } })])).toEqual([
      { key: expect.any(String), label: "On the 25th of every month", amount: 1_625_000 },
    ]);
  });

  it("a weekly choice says how often, and from which day when she picked one", () => {
    const rows = futurePayments([
      item({ variantId: "a", frequencyWeeks: 3, renewalFrequency: { kind: "weeks", every: 3 } }),
      item({ variantId: "b", frequencyWeeks: 2, renewalFrequency: { kind: "weeks", every: 2 }, firstRenewalDate: "2026-12-01" }),
    ]);
    expect(rows.map((r) => r.label)).toEqual(["Every 2 weeks, from Tue 1 Dec", "Every 3 weeks"]);
  });

  it("puts lines on the same schedule together, at the subscription price", () => {
    const monthly = { kind: "month_date", day: 25 } as const;
    const rows = futurePayments([
      item({ variantId: "a", renewalFrequency: monthly, frequencyWeeks: 4, subscriptionPrice: 1_500_000, quantity: 2 }),
      item({ variantId: "b", renewalFrequency: monthly, frequencyWeeks: 4, unitPrice: 300_000 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(3_300_000);
  });

  it("monthly on the 25th and every 4 weeks are different schedules", () => {
    const rows = futurePayments([
      item({ variantId: "a", renewalFrequency: { kind: "month_date", day: 25 }, frequencyWeeks: 4 }),
      item({ variantId: "b", renewalFrequency: { kind: "weeks", every: 4 }, frequencyWeeks: 4 }),
    ]);
    expect(rows.map((r) => r.label).sort()).toEqual(["Every 4 weeks", "On the 25th of every month"]);
  });

  it("an old-style line (weeks only) still says 'In N weeks'", () => {
    expect(futurePayments([item({ frequencyWeeks: 4 }), item({ variantId: "b", frequencyWeeks: 1 })]).map((r) => r.label)).toEqual(["In 1 week", "In 4 weeks"]);
  });

  it("leaves out one-time lines", () => {
    expect(futurePayments([item({ isAutoRenew: false, frequencyWeeks: 4 })])).toEqual([]);
  });
});
