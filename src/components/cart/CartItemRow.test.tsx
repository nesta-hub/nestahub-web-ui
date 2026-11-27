import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartProvider, type CartItem } from "@/contexts/CartContext";
import { CartItemRow } from "./CartItemRow";

const item = (over: Partial<CartItem> = {}): CartItem => ({
  variantId: "v1", productId: "p1", productName: "Kisskids Diapers", brand: "Kisskids", slug: "kisskids", typeId: "_default", typeName: "", quantity: 1, unitPrice: 500_000, ...over,
});
const show = (over: Partial<CartItem>) =>
  render(
    <CartProvider>
      <CartItemRow item={item(over)} />
    </CartProvider>,
  );

describe("what the cart row says about how it is bought", () => {
  it("one-time", () => {
    show({});
    expect(screen.getByText("One-time")).toBeInTheDocument();
  });

  it("an old-style subscription line says its weeks, exactly as before", () => {
    show({ isAutoRenew: true, frequencyWeeks: 3 });
    expect(screen.getByText("Every 3 weeks")).toBeInTheDocument();
  });

  it("a weekly choice from the new card says so, and the first day she picked", () => {
    show({ isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: "weeks", every: 3 }, firstRenewalDate: "2026-12-01" });
    expect(screen.getByText("Every 3 weeks, from Tue 1 Dec")).toBeInTheDocument();
  });

  it("a monthly choice says what she chose, not 'every 4 weeks'", () => {
    show({ isAutoRenew: true, frequencyWeeks: 4, renewalFrequency: { kind: "month_date", day: 25 } });
    expect(screen.getByText("On the 25th of every month")).toBeInTheDocument();
    expect(screen.queryByText(/Every 4 weeks/)).not.toBeInTheDocument();
  });

  it("a one-time choice made on the new card is one-time", () => {
    show({ isAutoRenew: false, renewalFrequency: null });
    expect(screen.getByText("One-time")).toBeInTheDocument();
  });
});
