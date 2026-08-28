import { describe, it, expect } from "vitest";
import {
  resolveOutcomeCopy,
  type AuthState,
  type DeliveryMethod,
} from "./giftOutcomeCopy";

/** What the buyer actually reads, across the lead/body/highlight fields. */
const sentence = (c: ReturnType<typeof resolveOutcomeCopy>) =>
  [c.bodyLead, c.body, c.bodyHighlight, c.bodyAfter].filter(Boolean).join("");

const labels = (c: ReturnType<typeof resolveOutcomeCopy>) =>
  c.ctas.map((x) => x.label);

const call = (
  authState: AuthState,
  deliveryMethod: DeliveryMethod,
  confirmed: boolean,
) =>
  resolveOutcomeCopy({
    authState,
    deliveryMethod,
    confirmed,
    orderKind: "gift_card",
    buyerEmail: "buyer@example.com",
    recipientEmail: "jane@example.com",
    recipientName: "Jane",
  });

describe("resolveOutcomeCopy — the 12 PRD variants", () => {
  it("1: logged-in · link · confirmed — links shown inline", () => {
    const c = call("user", "link", true);
    expect(c.view).toBe("confirmed");
    expect(c.heading).toBe("Payment Confirmed");
    expect(c.showLinks).toBe(true);
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("2: logged-in · link · not confirmed — link will be emailed to the buyer", () => {
    const c = call("user", "link", false);
    expect(c.view).toBe("pending");
    expect(sentence(c)).toContain("buyer@example.com");
    expect(c.showLinks).toBe(false);
    expect(labels(c)).toEqual(["View Order Status", "Return to Gifting"]);
  });

  it("3: logged-in · email · confirmed — Gift on Its Way, names the recipient", () => {
    const c = call("user", "email", true);
    expect(c.view).toBe("gift-sent");
    expect(c.heading).toBe("Gift on Its Way!");
    expect(sentence(c)).toContain("jane@example.com");
    expect(sentence(c)).toContain("inbox");
    expect(c.showLinks).toBe(false);
    expect(c.showWhatsAppPreview).toBeFalsy();
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("4: logged-in · email · not confirmed — names recipient AND buyer", () => {
    const c = call("user", "email", false);
    expect(c.view).toBe("pending");
    expect(sentence(c)).toContain("jane@example.com");
    expect(sentence(c)).toContain("buyer@example.com");
  });

  it("5: logged-in · whatsapp · confirmed — names the recipient, shows preview flag", () => {
    const c = call("user", "whatsapp", true);
    expect(c.view).toBe("gift-sent");
    expect(c.heading).toBe("Gift on Its Way!");
    expect(sentence(c)).toContain("Jane");
    expect(sentence(c)).toContain("WhatsApp");
    expect(sentence(c)).not.toContain("@");
    expect(c.showWhatsAppPreview).toBe(true);
  });

  it("6: logged-in · whatsapp · not confirmed", () => {
    const c = call("user", "whatsapp", false);
    expect(c.view).toBe("pending");
    expect(sentence(c)).toContain("WhatsApp");
    expect(sentence(c)).toContain("buyer@example.com");
  });

  it("7: guest · link · confirmed — links shown, no history, but a way out", () => {
    const c = call("guest", "link", true);
    expect(c.view).toBe("confirmed");
    expect(c.showLinks).toBe(true);
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("8: guest · link · not confirmed — released, no order page offered", () => {
    const c = call("guest", "link", false);
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("9: guest · email · confirmed", () => {
    const c = call("guest", "email", true);
    expect(c.view).toBe("gift-sent");
    expect(c.heading).toBe("Gift on Its Way!");
    expect(c.showLinks).toBe(false);
    expect(c.showWhatsAppPreview).toBeFalsy();
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("10: guest · email · not confirmed", () => {
    const c = call("guest", "email", false);
    expect(c.view).toBe("pending");
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });

  it("11: guest · whatsapp · confirmed", () => {
    const c = call("guest", "whatsapp", true);
    expect(c.view).toBe("gift-sent");
    expect(c.heading).toBe("Gift on Its Way!");
    expect(sentence(c)).toContain("WhatsApp");
    expect(c.showWhatsAppPreview).toBe(true);
  });

  it("12: guest · whatsapp · not confirmed", () => {
    const c = call("guest", "whatsapp", false);
    expect(c.view).toBe("pending");
    expect(labels(c)).toEqual(["Return to Gifting"]);
  });
});

describe("resolveOutcomeCopy — invariants across the matrix", () => {
  const auths: AuthState[] = ["user", "guest"];
  const methods: DeliveryMethod[] = ["link", "email", "whatsapp"];

  it("never offers a guest their order history", () => {
    for (const m of methods) {
      for (const confirmed of [true, false]) {
        const c = call("guest", m, confirmed);
        expect(c.ctas.some((x) => x.action === "order-history")).toBe(false);
      }
    }
  });

  it("never leaves a full-screen overlay without an exit", () => {
    for (const a of auths) {
      for (const m of methods) {
        for (const confirmed of [true, false]) {
          expect(call(a, m, confirmed).ctas.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("always releases the buyer when unconfirmed", () => {
    for (const a of auths) {
      for (const m of methods) {
        expect(call(a, m, false).ctas.length).toBeGreaterThan(0);
      }
    }
  });

  it("never shows links before payment is confirmed", () => {
    for (const a of auths) {
      for (const m of methods) {
        expect(call(a, m, false).showLinks).toBe(false);
      }
    }
  });

  it("shows links only for link delivery — we never re-share what we sent", () => {
    for (const a of auths) {
      expect(call(a, "link", true).showLinks).toBe(true);
      expect(call(a, "email", true).showLinks).toBe(false);
      expect(call(a, "whatsapp", true).showLinks).toBe(false);
    }
  });

  it("always produces a heading and a body", () => {
    for (const a of auths) {
      for (const m of methods) {
        for (const confirmed of [true, false]) {
          const c = call(a, m, confirmed);
          expect(c.heading.length).toBeGreaterThan(0);
          expect(sentence(c).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("degrades gracefully when the status payload has no addresses", () => {
    for (const m of methods) {
      for (const confirmed of [true, false]) {
        const body = sentence(
          resolveOutcomeCopy({
            authState: "guest",
            deliveryMethod: m,
            confirmed,
            orderKind: "gift_card",
          }),
        );
        expect(body).not.toContain("undefined");
        expect(body).not.toContain("null");
        // No placeholder should appear twice — that is how "goes to your email
        // and we'll notify you at your email" got written.
        expect(body.split("your email").length - 1).toBeLessThanOrEqual(1);
        // "we'll ... and we'll ..." — a conjunction that stutters.
        expect(body).not.toContain("and we'll let you know");
      }
    }
  });

  it("never tells the buyer their gift went to their own address", () => {
    // A missing recipient address must not fall back to the buyer's phrasing.
    const c = resolveOutcomeCopy({
      authState: "user",
      deliveryMethod: "email",
      confirmed: true,
      orderKind: "gift_card",
    });
    expect(sentence(c)).toContain("the recipient");
    expect(sentence(c)).not.toContain("your email");
  });
});

describe("resolveOutcomeCopy — regular orders", () => {
  const regular = (confirmed: boolean) =>
    resolveOutcomeCopy({
      authState: "user",
      deliveryMethod: "link",
      confirmed,
      orderKind: "other",
      buyerEmail: "buyer@example.com",
    });

  it("confirms without offering anything to share", () => {
    const c = regular(true);
    expect(c.heading).toBe("Payment Confirmed");
    expect(c.showLinks).toBe(false);
    expect(labels(c)).toEqual(["View Order", "Return to Shop"]);
  });

  it("releases with a notification promise", () => {
    const c = regular(false);
    expect(sentence(c)).toContain("buyer@example.com");
  });
});
