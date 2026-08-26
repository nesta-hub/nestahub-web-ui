import { describe, it, expect } from "vitest";
import { mapOrdersToGiftingHistory } from "./giftingHistory";
import type { MyOrder } from "@/lib/api";

const base = {
  status: "completed",
  totalAmount: 2000000,
  createdAt: "2026-08-01T10:00:00Z",
  deliveryMethod: "pickup",
  fullName: "Buyer",
  deliveryAddress: null,
  pickupStationName: null,
  pickupStationAddress: null,
  items: [],
  canCancel: false,
  canConfirmPayment: false,
  paymentOption: null,
} as const;

const order = (over: Partial<MyOrder>): MyOrder =>
  ({ ...base, orderNumber: "ORD-1", orderType: "gift_card", ...over }) as MyOrder;

describe("mapOrdersToGiftingHistory", () => {
  it("emits one entry per issued card, each with its own link", () => {
    const entries = mapOrdersToGiftingHistory([
      order({
        giftCards: [
          {
            id: "c1",
            link: "https://nestahub.ng/gift/c1",
            themeId: "welcome-world",
            amount: 1000000,
            recipientName: "Jane",
            deliveryMethod: "email",
            recipientEmail: "jane@example.com",
            deliveredAt: "2026-08-01T10:05:00Z",
          },
          {
            id: "c2",
            link: "https://nestahub.ng/gift/c2",
            themeId: "welcome-world",
            amount: 1000000,
            recipientName: "Tunde",
            deliveryMethod: "link",
            deliveredAt: null,
          },
        ],
      }),
    ]);

    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.shareableLink)).toEqual([
      "https://nestahub.ng/gift/c1",
      "https://nestahub.ng/gift/c2",
    ]);
    // Both belong to one order, so the order number is shared.
    expect(new Set(entries.map((e) => e.orderNumber))).toEqual(new Set(["ORD-1"]));
  });

  it("falls back to order items when no card has been issued yet", () => {
    const entries = mapOrdersToGiftingHistory([
      order({
        status: "payment_made",
        giftCards: null,
        giftCardOrderItems: [
          { id: "i1", themeId: "welcome-world", amount: 1000000, recipientName: "Ada" },
        ],
      }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("pending-payment");
    // No card exists, so there is nothing to share.
    expect(entries[0].shareableLink).toBeUndefined();
  });

  it("prefers issued cards over order items when both exist", () => {
    const entries = mapOrdersToGiftingHistory([
      order({
        giftCards: [
          {
            id: "c1",
            link: "https://nestahub.ng/gift/c1",
            themeId: "t",
            amount: 1000000,
            recipientName: "Jane",
            deliveryMethod: "link",
          },
        ],
        giftCardOrderItems: [
          { id: "i1", themeId: "t", amount: 1000000, recipientName: "Jane" },
        ],
      }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("c1");
  });

  it("keeps legacy single-card orders visible", () => {
    const entries = mapOrdersToGiftingHistory([
      order({
        giftCards: null,
        giftCardOrderItems: null,
        giftCardAmount: 1500000,
        giftCardRecipientName: "Chiamaka",
        giftCardThemeId: "little-sunshine",
      }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].recipientName).toBe("Chiamaka");
    expect(entries[0].amount).toBe(1500000);
  });

  it("carries bundles through with their items", () => {
    const entries = mapOrdersToGiftingHistory([
      order({
        orderType: "gift_bundle",
        bundleName: "Newborn Essentials",
        giftRecipientName: "Ifeoma",
        items: [
          { productName: "Diapers", productBrand: "X", variant: "NB", quantity: 2, unitPrice: 100 },
        ],
      } as Partial<MyOrder>),
    ]);

    expect(entries[0].kind).toBe("gift-bundle");
    expect(entries[0].deliveryMode).toBe("physical");
    expect(entries[0].items).toEqual([{ name: "Diapers", qty: 2 }]);
  });

  it("ignores order types that are not gifts", () => {
    expect(
      mapOrdersToGiftingHistory([order({ orderType: "shop" })]),
    ).toEqual([]);
  });
});
