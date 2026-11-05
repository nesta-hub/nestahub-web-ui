import { describe, expect, it } from "vitest";
import type { MyOrder } from "@/lib/api";
import { firstNameOf, lagosDay, nextDay, pickWelcomeChips } from "./welcomeChips";

const TODAY = "2026-10-31"; // a Saturday

const order = (over: Partial<MyOrder> = {}): MyOrder => ({
  orderNumber: "NSTAAA111",
  status: "processing",
  orderType: "shop",
  totalAmount: 1_240_000,
  createdAt: "2026-10-30T10:00:00Z",
  deliveryMethod: "address",
  deliveryFee: null,
  deliveryType: null,
  deliveryZoneName: null,
  scheduledDeliveryDate: null,
  fullName: "Sade",
  deliveryAddress: null,
  pickupStationName: null,
  pickupStationAddress: null,
  items: [],
  canCancel: false,
  canConfirmPayment: false,
  paymentOption: null,
  ...over,
});

const pick = (orders: MyOrder[], cartCount = 0) => pickWelcomeChips({ orders, cartCount, today: TODAY });
const labels = (orders: MyOrder[], cartCount = 0) => pick(orders, cartCount).map((c) => c.label);

describe("welcome chips", () => {
  it("says nothing when there is no cart and no active order", () => {
    expect(pick([])).toEqual([]);
  });

  describe("the cart", () => {
    it("shows how many items are in it", () => {
      expect(pick([], 2)).toEqual([{ kind: "cart", label: "2 in your cart", target: { type: "cart" } }]);
    });
  });

  describe("an order waiting for payment", () => {
    const unpaid = order({ orderNumber: "NSTPAY001", status: "order_submitted", canConfirmPayment: true, totalAmount: 1_240_000 });

    it("asks for the amount and opens that order's payment", () => {
      expect(pick([unpaid])).toEqual([
        { kind: "pay", label: "Pay ₦12,400", target: { type: "orders", orderNumber: "NSTPAY001", pay: true } },
      ]);
    });

    it("says how many when several are waiting, and opens the list", () => {
      const other = order({ orderNumber: "NSTPAY002", status: "order_submitted", canConfirmPayment: true });

      expect(pick([unpaid, other])).toEqual([{ kind: "pay", label: "Pay for 2 orders", target: { type: "orders" } }]);
    });

    it("comes before everything else, even a full cart and a delivery today", () => {
      const dueToday = order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY });

      expect(labels([dueToday, unpaid], 3)).toEqual(["Pay ₦12,400", "Delivery today"]);
    });

    it("is not offered for an order the buyer cannot pay yet (pay on delivery)", () => {
      const onDelivery = order({ status: "order_submitted", canConfirmPayment: false, paymentOption: "pay-on-delivery" });

      expect(labels([onDelivery])).not.toContain("Pay ₦12,400");
    });
  });

  describe("a delivery today or tomorrow", () => {
    it("says today", () => {
      expect(pick([order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY })])).toEqual([
        { kind: "delivery", label: "Delivery today", target: { type: "orders", orderNumber: "NSTDUE001" } },
      ]);
    });

    it("says tomorrow", () => {
      expect(labels([order({ scheduledDeliveryDate: "2026-11-01" })])).toEqual(["Delivery tomorrow"]);
    });

    it("counts several arriving the same day", () => {
      const a = order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY });
      const b = order({ orderNumber: "NSTDUE002", scheduledDeliveryDate: TODAY });

      expect(pick([a, b])).toEqual([{ kind: "delivery", label: "2 deliveries today", target: { type: "orders" } }]);
    });

    it("prefers today to tomorrow, and the later order falls to the status chip", () => {
      const today = order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY });
      const tomorrow = order({ orderNumber: "NSTDUE002", scheduledDeliveryDate: "2026-11-01" });

      expect(labels([today, tomorrow])).toEqual(["Delivery today", "Delivery Sun 1 Nov"]);
    });

    it("outranks the cart", () => {
      expect(labels([order({ scheduledDeliveryDate: TODAY })], 2)).toEqual(["Delivery today", "2 in your cart"]);
    });

    it("does not promise a day for a payment that is still being verified", () => {
      const verifying = order({ status: "payment_made", scheduledDeliveryDate: TODAY });

      expect(labels([verifying])).toEqual(["Verifying payment"]);
    });

    it("counts a pay-on-delivery order, whose day is a real promise", () => {
      const onDelivery = order({ status: "order_submitted", canConfirmPayment: false, scheduledDeliveryDate: TODAY });

      expect(labels([onDelivery])).toEqual(["Delivery today"]);
    });
  });

  describe("any other active order", () => {
    it("names the delivery day", () => {
      expect(pick([order({ orderNumber: "NSTLATE01", scheduledDeliveryDate: "2026-11-06" })])).toEqual([
        { kind: "order", label: "Delivery Fri 6 Nov", target: { type: "orders", orderNumber: "NSTLATE01" } },
      ]);
    });

    it("says it is being prepared when there is no day (pickup, or an older order)", () => {
      expect(labels([order({ scheduledDeliveryDate: null })])).toEqual(["Order being prepared"]);
    });

    it("does not announce a day that has already passed", () => {
      expect(labels([order({ scheduledDeliveryDate: "2026-10-29" })])).toEqual(["Order being prepared"]);
    });

    it("says the payment is being verified once the buyer has reported it", () => {
      expect(labels([order({ status: "payment_made" })])).toEqual(["Verifying payment"]);
    });

    it("counts several", () => {
      const a = order({ orderNumber: "NSTONE001", scheduledDeliveryDate: "2026-11-06" });
      const b = order({ orderNumber: "NSTTWO002", scheduledDeliveryDate: "2026-11-07" });

      expect(pick([a, b])).toEqual([{ kind: "order", label: "2 active orders", target: { type: "orders" } }]);
    });

    it("follows the cart", () => {
      expect(labels([order({ scheduledDeliveryDate: "2026-11-06" })], 2)).toEqual(["2 in your cart", "Delivery Fri 6 Nov"]);
    });
  });

  describe("orders that are over", () => {
    it.each(["completed", "cancelled"])("ignores a %s order", (status) => {
      expect(pick([order({ status, scheduledDeliveryDate: TODAY })])).toEqual([]);
    });
  });

  it("never shows more than two chips", () => {
    const unpaid = order({ orderNumber: "NSTPAY001", status: "order_submitted", canConfirmPayment: true });
    const dueToday = order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY });
    const later = order({ orderNumber: "NSTLATE01", scheduledDeliveryDate: "2026-11-06" });

    // Payment, delivery, cart and status all apply; only the first two are shown.
    expect(labels([later, dueToday, unpaid], 2)).toEqual(["Pay ₦12,400", "Delivery today"]);
  });

  it("puts the payment, then the delivery, then the cart, then the status in that order", () => {
    const dueToday = order({ orderNumber: "NSTDUE001", scheduledDeliveryDate: TODAY });
    const later = order({ orderNumber: "NSTLATE01", scheduledDeliveryDate: "2026-11-06" });

    expect(pickWelcomeChips({ orders: [later, dueToday], cartCount: 1, today: TODAY }).map((c) => c.kind)).toEqual(["delivery", "cart"]);
    expect(pickWelcomeChips({ orders: [later], cartCount: 1, today: TODAY }).map((c) => c.kind)).toEqual(["cart", "order"]);
  });
});

describe("lagosDay", () => {
  it("is the Lagos calendar day, which runs an hour ahead of UTC", () => {
    expect(lagosDay(new Date("2026-10-31T10:00:00Z"))).toBe("2026-10-31");
    // 23:30 UTC on the 31st is 00:30 on 1 November in Lagos.
    expect(lagosDay(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });
});

describe("nextDay", () => {
  it.each([
    ["2026-10-31", "2026-11-01"],
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
  ])("%s -> %s", (from, to) => {
    expect(nextDay(from)).toBe(to);
  });
});

describe("firstNameOf", () => {
  it.each([
    ["Sade Adeyemi", "Sade"],
    ["  Sade  ", "Sade"],
    ["Sade", "Sade"],
    ["", null],
    ["   ", null],
    [undefined, null],
    [null, null],
  ])("%j -> %j", (input, expected) => {
    expect(firstNameOf(input as string | null | undefined)).toBe(expected);
  });
});
