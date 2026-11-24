import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Box } from "@/lib/subscriptionBoxes";
import { NextOrderCard } from "./NextOrderCard";

const line = (over = {}) => ({
  id: "l1", subscriptionId: "s1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3",
  imageUrl: null, quantity: 2, unitPriceKobo: 450_000, lineTotalKobo: 900_000, dueDate: "2026-11-25", kind: "subscription" as const, ...over,
});
const extra = (over = {}) => line({ id: "x1", subscriptionId: null, variantId: "v9", productName: "Nappy cream", variantLabel: null, quantity: 3, unitPriceKobo: 310_000, lineTotalKobo: 930_000, dueDate: null, kind: "one_time", ...over });
const box = (items: ReturnType<typeof line>[]): Box => ({
  id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
  delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
  needsDelivery: false, items, subtotalKobo: 1_830_000, deliveryFeeKobo: 50_000, totalKobo: 1_880_000, order: null, canPay: true, canUndoSkip: false, openDays: [],
});

const card = (b: Box) => {
  render(<NextOrderCard box={b} first busy={false} onPay={vi.fn()} onMakeChanges={vi.fn()} onSkip={vi.fn()} onAddExtras={vi.fn()} onChangeLocation={vi.fn()} />);
  return within(screen.getByRole("region", { name: "Next order" }));
};

describe("what is in the next order, one line each", () => {
  it("lists every item on its own line with how many, and says '(extra)' after something she added just for this order", () => {
    const c = card(box([line(), extra()]));
    expect(c.getByText("Kisskids Diapers ×2")).toBeInTheDocument();
    expect(c.getByText("Nappy cream ×3 (extra)")).toBeInTheDocument();
  });

  it("keeps the order she sees them in, and puts '(extra)' only on the extras", () => {
    const c = card(box([line(), extra(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", quantity: 1 })]));
    const lines = c.getByText("Kisskids Diapers ×2").parentElement!.children;
    expect(Array.from(lines).map((l) => l.textContent)).toEqual(["Kisskids Diapers ×2", "Nappy cream ×3 (extra)", "Baby wipes ×1"]);
  });

  it("says '(new)' after an item on its first delivery, and nothing after one that has been before", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby milk", quantity: 1, firstTime: true }), extra()]));
    const lines = c.getByText("Kisskids Diapers ×2").parentElement!.children;
    expect(Array.from(lines).map((l) => l.textContent)).toEqual(["Kisskids Diapers ×2", "Baby milk ×1 (new)", "Nappy cream ×3 (extra)"]);
  });

  it("an extra is '(extra)', never '(new)'", () => {
    const c = card(box([line(), extra({ firstTime: true })]));
    expect(c.getByText("Nappy cream ×3 (extra)")).toBeInTheDocument();
  });

  it("says '(extra)' on each extra", () => {
    const c = card(box([line(), extra(), extra({ id: "x2", variantId: "v10", productName: "Baby powder", quantity: 1 })]));
    expect(c.getByText("Nappy cream ×3 (extra)")).toBeInTheDocument();
    expect(c.getByText("Baby powder ×1 (extra)")).toBeInTheDocument();
  });

  it("says '×1' for one of something, as the design does, and no '(extra)' when every item is a subscription item", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", quantity: 1 })]));
    expect(c.getByText("Baby wipes ×1")).toBeInTheDocument();
    expect(c.queryByText(/\(extra\)/)).toBeNull();
  });
});

describe("the four buttons", () => {
  it("are Pay now, Make changes, Skip and Add extra items, in two rows of two, and the card says nothing about when to pay by", () => {
    const c = card(box([line()]));
    const buttons = c.getAllByRole("button").filter((b) => b.className.includes("h-12"));
    expect(buttons.map((b) => b.textContent)).toEqual(["Pay now", "Make changes", "Skip", "Add extra items"]);
    expect(buttons[0].parentElement).toHaveClass("grid-cols-2");
    expect(buttons[0]).toHaveClass("bg-shop-ink"); // Pay now keeps the design's near-black; the other buttons follow it
    expect(c.queryByText(/Pay by/)).toBeNull();
  });

  it("Add extra items asks the page to start shopping for this order", () => {
    const onAddExtras = vi.fn();
    render(<NextOrderCard box={box([line()])} first busy={false} onPay={vi.fn()} onMakeChanges={vi.fn()} onSkip={vi.fn()} onAddExtras={onAddExtras} onChangeLocation={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add extra items" }));
    expect(onAddExtras).toHaveBeenCalledTimes(1);
  });

  it("are not there for an order she can no longer change", () => {
    render(<NextOrderCard box={{ ...box([line()]), editable: false }} first busy={false} onPay={vi.fn()} onMakeChanges={vi.fn()} onSkip={vi.fn()} onAddExtras={vi.fn()} onChangeLocation={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Add extra items" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pay now" })).toBeNull();
  });
});
