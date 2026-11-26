import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

/** Each item's first line ("Kisskids Diapers ×2"), in the order she sees them. */
const names = (c: ReturnType<typeof card>) =>
  Array.from(c.getByText("Kisskids Diapers ×2").closest(".flex-col")!.children).map((item) => item.firstElementChild!.firstElementChild!.textContent);

describe("what is in the next order, one item each", () => {
  it("names each item as the shop does, brand first (never twice), with how many, and its size or type under it", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", variantLabel: "120sheets · Half carton", quantity: 1 })]));
    expect(c.getByText("Kisskids Diapers ×2")).toBeInTheDocument(); // the name already starts with the brand
    expect(c.getByText("Size 3")).toBeInTheDocument();
    expect(c.getByText("Kisskids Baby wipes ×1")).toBeInTheDocument();
    expect(c.getByText("120sheets · Half carton")).toBeInTheDocument();
  });

  it("an item with no brand or no size just has its name", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", brand: null, variantLabel: null, quantity: 1 })]));
    const item = c.getByText("Baby wipes ×1").parentElement!;
    expect(item.children).toHaveLength(1);
  });

  it("says '(extra)' after something she added just for this order", () => {
    const c = card(box([line(), extra()]));
    expect(c.getByText("Kisskids Nappy cream ×3 (extra)")).toBeInTheDocument();
  });

  it("keeps the order she sees them in, and puts '(extra)' only on the extras", () => {
    const c = card(box([line(), extra(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", quantity: 1 })]));
    expect(names(c)).toEqual(["Kisskids Diapers ×2", "Kisskids Nappy cream ×3 (extra)", "Kisskids Baby wipes ×1"]);
  });

  it("says '(new)' after an item on its first delivery, and nothing after one that has been before", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby milk", quantity: 1, firstTime: true }), extra()]));
    expect(names(c)).toEqual(["Kisskids Diapers ×2", "Kisskids Baby milk ×1 (new)", "Kisskids Nappy cream ×3 (extra)"]);
  });

  it("an extra is '(extra)', never '(new)'", () => {
    const c = card(box([line(), extra({ firstTime: true })]));
    expect(c.getByText("Kisskids Nappy cream ×3 (extra)")).toBeInTheDocument();
  });

  it("says '(extra)' on each extra", () => {
    const c = card(box([line(), extra(), extra({ id: "x2", variantId: "v10", productName: "Baby powder", quantity: 1 })]));
    expect(c.getByText("Kisskids Nappy cream ×3 (extra)")).toBeInTheDocument();
    expect(c.getByText("Kisskids Baby powder ×1 (extra)")).toBeInTheDocument();
  });

  it("says '×1' for one of something, as the design does, and no '(extra)' when every item is a subscription item", () => {
    const c = card(box([line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", quantity: 1 })]));
    expect(c.getByText("Kisskids Baby wipes ×1")).toBeInTheDocument();
    expect(c.queryByText(/\(extra\)/)).toBeNull();
  });
});

describe("taking an extra out from the card", () => {
  const render2 = (b: Box, onRemoveExtra = vi.fn(), busy = false) => {
    render(<NextOrderCard box={b} first busy={busy} onPay={vi.fn()} onMakeChanges={vi.fn()} onSkip={vi.fn()} onAddExtras={vi.fn()} onChangeLocation={vi.fn()} onRemoveExtra={onRemoveExtra} />);
    return onRemoveExtra;
  };

  it("each extra has a red minus that takes that line out", () => {
    const onRemoveExtra = render2(box([line(), extra()]));
    const minus = screen.getByRole("button", { name: "Remove Nappy cream (extra)" });
    expect(minus.querySelector(".bg-\\[\\#D14343\\]")).not.toBeNull();
    fireEvent.click(minus);
    expect(onRemoveExtra).toHaveBeenCalledWith("x1");
  });

  it("subscription items have no minus (they are left out through Make changes)", () => {
    render2(box([line(), extra()]));
    expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(1);
  });

  it("no minus once the order can no longer change", () => {
    render2({ ...box([line(), extra()]), editable: false });
    expect(screen.queryByRole("button", { name: /^Remove / })).toBeNull();
  });

  it("the minus waits while something else is being saved", () => {
    render2(box([line(), extra()]), vi.fn(), true);
    expect(screen.getByRole("button", { name: "Remove Nappy cream (extra)" })).toBeDisabled();
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

  it("Pay now has an arrow; once an order exists it says Continue to pay, with no arrow", () => {
    const first = card(box([line()]));
    expect(first.getByRole("button", { name: "Pay now" }).querySelector("svg")).not.toBeNull();
    cleanup();
    const again = card({ ...box([line()]), order: { orderNumber: "NST-1", status: "order_submitted" } } as Box);
    expect(again.getByRole("button", { name: "Continue to pay" }).querySelector("svg")).toBeNull();
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
