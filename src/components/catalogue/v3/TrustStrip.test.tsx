import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustStrip } from "./TrustStrip";
import { HERO_SLIDES, MOBILE_OFFERS, REFERRAL_REWARDS, TRUST_ITEMS } from "./offers";

describe("why shop with us", () => {
  it("lists the four reasons", () => {
    render(<TrustStrip />);

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(TRUST_ITEMS.map((t) => `${t.title}${t.sub}`));
    expect(screen.getByText("Lagos delivery")).toBeInTheDocument();
    expect(screen.getByText("Cashback")).toBeInTheDocument();
  });

  it("does not put a delivery price in the copy: delivery fees are a staff setting", () => {
    render(<TrustStrip />);

    expect(screen.getByText("Lagos delivery").parentElement).not.toHaveTextContent("₦");
    for (const slide of HERO_SLIDES) expect(slide.lead).not.toMatch(/deliver\w* (from|for|at) ₦/i);
  });
});

describe("the offers' copy", () => {
  it("gives every offer somewhere to go", () => {
    for (const offer of MOBILE_OFFERS) {
      const a = offer.action;
      expect(a.kind === "link" ? a.to : a.kind === "group" ? a.slug : a.kind === "search" ? a.query : "browse").toBeTruthy();
    }
    for (const slide of HERO_SLIDES) {
      expect(slide.action.kind === "link" ? slide.action.to : slide.action.target).toBeTruthy();
    }
  });

  it("gives every phone offer its own card colour", () => {
    expect(new Set(MOBILE_OFFERS.map((o) => o.bg)).size).toBe(MOBILE_OFFERS.length);
  });

  it("makes the shop offer a soft blue, unlike the lime, butter, sage, peach and tan of the others", () => {
    const [shop, ...others] = MOBILE_OFFERS;

    expect(shop.id).toBe("shop");
    expect(shop.bg).toBe("#E0E6EE");
    expect(others.map((o) => o.bg)).toEqual(["#EEF2DB", "#F2E8CC", "#DDE3DA", "#EEDFD2", "#E8E0D4"]);
  });

  it("has six offers on the phone: the shop, Moobi, Community Delivery, toys, gift cards and referrals, in that order", () => {
    expect(MOBILE_OFFERS.map((o) => o.id)).toEqual(["shop", "moobi", "community-delivery", "toys", "gift-cards", "referrals"]);
  });

  it("gives the shop and Community Delivery cards no button: they are messages", () => {
    const withoutButton = MOBILE_OFFERS.filter((o) => !o.cta).map((o) => o.id);

    expect(withoutButton).toEqual(["shop", "community-delivery"]);
  });

  it("sends the Moobi card to a search for Moobi, not away from the page", () => {
    expect(MOBILE_OFFERS.find((o) => o.id === "moobi")!.action).toEqual({ kind: "search", query: "Moobi" });
  });

  it("announces Community Delivery as ₦500 on Wednesdays and Saturdays in Gbagada, Anthony and Bariga", () => {
    const delivery = MOBILE_OFFERS.find((o) => o.id === "community-delivery")!;

    expect(delivery.badge).toBe("COMMUNITY DELIVERY");
    expect(delivery.title).toBe("Good news!");
    // The areas are in **bold**.
    expect(delivery.sub).toBe("Just ₦500 delivery to **Gbagada**, **Anthony** and **Bariga**, every ==Wednesday and Saturday==.");
    // ...and the days are ==highlighted== in their own colour.
    // ...in the same colour as its badge.
    expect(delivery.highlightColor).toBe(delivery.badgeColor);
    expect(delivery.highlightColor).toBe("#7A4F33");
  });

  it("says Moobi is now on Nesta Hub, without introducing a brand parents already know", () => {
    const moobi = MOBILE_OFFERS.find((o) => o.id === "moobi")!;

    expect(moobi.badge).toBe("NOW ON NESTA HUB");
    expect(moobi.title).toBe("Moobi is here");
    expect(moobi.sub).toBe("Check out the Moobi range of baby products");
    expect(`${moobi.title} ${moobi.sub}`).not.toMatch(/meet/i);
  });

  it("keeps every caption's **bold** and ==highlight== markers in pairs, so none leaks onto the screen", () => {
    for (const offer of MOBILE_OFFERS) {
      expect((offer.sub.match(/\*\*/g) ?? []).length % 2).toBe(0);
      expect((offer.sub.match(/==/g) ?? []).length % 2).toBe(0);
    }
  });

  it("gives a highlight colour to exactly the cards whose caption has something to highlight", () => {
    for (const offer of MOBILE_OFFERS) expect(!!offer.highlightColor).toBe(offer.sub.includes("=="));
  });

  it("puts a delivery price on no phone card but the Community Delivery one", () => {
    const words = (o: (typeof MOBILE_OFFERS)[number]) => `${o.badge} ${o.title} ${o.sub}`;
    const pricesDelivery = MOBILE_OFFERS.filter((o) => /deliver/i.test(words(o)) && /₦/.test(words(o)));

    expect(pricesDelivery.map((o) => o.id)).toEqual(["community-delivery"]);
  });

  it("sends the referral offers to the share page", () => {
    expect(MOBILE_OFFERS.find((o) => o.id === "referrals")!.action).toEqual({ kind: "link", to: "/share" });
    expect(HERO_SLIDES.find((s) => s.id === "share")!.action).toEqual({ kind: "link", to: "/share" });
  });

  it("sends the toys offer to the toys group on the page, not away from it", () => {
    expect(MOBILE_OFFERS.find((o) => o.id === "toys")!.action).toEqual({ kind: "group", slug: "back-to-school" });
    expect(HERO_SLIDES.find((s) => s.id === "toys")!.action).toEqual({ kind: "scroll", target: "g-back-to-school" });
  });

  it("sends the gift card offers to the gifting page, not straight to gift cards", () => {
    expect(MOBILE_OFFERS.find((o) => o.id === "gift-cards")!.action).toEqual({ kind: "link", to: "/gifting" });
    expect(HERO_SLIDES.find((s) => s.id === "gift")!.action).toEqual({ kind: "link", to: "/gifting" });
  });

  it("has the same four on the desktop hero", () => {
    expect(HERO_SLIDES.map((s) => s.id)).toEqual(["shop", "toys", "gift", "share"]);
  });

  it("says a tote bag at 4 referrals and a tumbler at 20, from one place", () => {
    const share = HERO_SLIDES.find((s) => s.id === "share")!;
    const phone = MOBILE_OFFERS.find((o) => o.id === "referrals")!;

    expect(REFERRAL_REWARDS).toEqual({ tote: 4, tumbler: 20 });
    expect(share.lead).toContain("tote bag after 4 referrals");
    expect(share.lead).toContain("tumbler at 20");
    expect(phone.sub).toBe("A tote bag after 4 referrals.");
  });

  it("no longer talks about the hoodie", () => {
    const everything = [...HERO_SLIDES.map((s) => s.lead), ...MOBILE_OFFERS.map((o) => `${o.title} ${o.sub}`)].join(" ");

    expect(everything).not.toMatch(/hoodie/i);
  });
});
