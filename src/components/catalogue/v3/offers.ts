/**
 * The marketing slides on the shop: four on the phone and four on desktop. Copy lives here so
 * it can be edited in one place. Prices in the copy are static; change them here if they move.
 *
 * (Delivery is deliberately not priced in the copy: its fees are a staff setting.)
 */

/**
 * How many referrals earn each reward, as the adverts say it. These are the numbers the shop
 * owner gave on 2026-10-24. NOTE: the Share page's own reward list
 * (components/referrals/referralData.ts) still has the tote bag at 2 referrals and the
 * insulated tumbler at 3. Keep the two in step, or the advert promises something the Share
 * page does not give.
 */
export const REFERRAL_REWARDS = { tote: 4, tumbler: 20 } as const;

/** What tapping an offer on the phone does. */
export type OfferAction =
  /** Show every group and scroll down to the categories. */
  | { kind: "browse" }
  /** Show one group and scroll down to its categories. */
  | { kind: "group"; slug: string }
  | { kind: "link"; to: string };

export interface MobileOffer {
  id: "shop" | "toys" | "gift-cards" | "referrals";
  action: OfferAction;
  bg: string;
  badge: string;
  badgeColor: string;
  title: string;
  sub: string;
  subColor: string;
  cta: string;
}

export const MOBILE_OFFERS: MobileOffer[] = [
  {
    id: "shop",
    action: { kind: "browse" },
    bg: "#E0E6EE", // soft blue: the other three are sage, peach and tan
    badge: "NESTA HUB",
    badgeColor: "#324461",
    title: "Everything for baby and mum",
    sub: "Low prices, at your door.",
    subColor: "#4A5568",
    cta: "Shop now",
  },
  {
    id: "toys",
    action: { kind: "group", slug: "back-to-school" },
    bg: "#DDE3DA",
    badge: "TOYS & LEARNING",
    badgeColor: "#46564A",
    title: "Play that teaches",
    sub: "Magnetic sets from ₦5,000.",
    subColor: "#5A4E44",
    cta: "Shop toys",
  },
  {
    id: "gift-cards",
    action: { kind: "link", to: "/gifting" },
    bg: "#EEDFD2",
    badge: "GIFT CARDS",
    badgeColor: "#7A4F33",
    title: "Send a gift card",
    sub: "From ₦10,000. WhatsApp or email.",
    subColor: "#4A5249",
    cta: "Send one",
  },
  {
    id: "referrals",
    action: { kind: "link", to: "/share" },
    bg: "#E8E0D4",
    badge: "SHARE NESTAHUB",
    badgeColor: "#795A3E",
    title: "Know a mum? Earn rewards",
    sub: `A tote bag after ${REFERRAL_REWARDS.tote} referrals.`,
    subColor: "#5A4A40",
    cta: "Start sharing",
  },
];

export type SlideAction = { kind: "scroll"; target: string } | { kind: "link"; to: string };

export interface HeroSlide {
  id: "shop" | "toys" | "gift" | "share";
  bg: string;
  circleBig: string;
  circleSmall: string;
  title: string;
  lead: string;
  cta: string;
  action: SlideAction;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "shop",
    bg: "#ECE3D6",
    circleBig: "#F3ECE0",
    circleSmall: "#DDE3DA",
    title: "Everything for baby and mum, at your door.",
    lead: "Low prices, careful Lagos delivery, and subscriptions so you never run out of the things you always need.",
    cta: "Start shopping",
    action: { kind: "scroll", target: "shop" },
  },
  {
    id: "toys",
    bg: "#DDE3DA",
    circleBig: "#E6EBE3",
    circleSmall: "#D2DBD0",
    title: "Play that teaches.",
    lead: "Magnetic alphabet sets from ₦5,000, ring stacks from ₦6,000 and more early-learning toys for little hands.",
    cta: "Shop toys",
    // Scrolls to the toys group on the page (the Learning group), rather than leaving it.
    action: { kind: "scroll", target: "g-back-to-school" },
  },
  {
    id: "gift",
    bg: "#EEDFD2",
    circleBig: "#F4E9DD",
    circleSmall: "#E8D5C5",
    title: "Send a gift card, with a note.",
    lead: "From ₦10,000, sent by WhatsApp or email with a personal message of up to 150 characters. Pick from five themes.",
    cta: "Send a gift card",
    action: { kind: "link", to: "/gifting" },
  },
  {
    id: "share",
    bg: "#E8E0D4",
    circleBig: "#EFE8DD",
    circleSmall: "#DDD3C4",
    title: "Know a mum? Earn rewards.",
    lead: `Share your code and unlock a tote bag after ${REFERRAL_REWARDS.tote} referrals, all the way up to a tumbler at ${REFERRAL_REWARDS.tumbler}. Points never expire.`,
    cta: "Start sharing",
    action: { kind: "link", to: "/share" },
  },
];

export interface TrustItem {
  title: string;
  sub: string;
  /** Icon circle: background and icon colour. */
  tone: { bg: string; fg: string };
}

export const TRUST_ITEMS: TrustItem[] = [
  { title: "Lagos delivery", sub: "Careful and on time, across Lagos", tone: { bg: "#EEE6D9", fg: "#795A3E" } },
  { title: "Unbeatable prices", sub: "Low prices on every essential", tone: { bg: "#E4EADF", fg: "#46564A" } },
  { title: "Subscriptions", sub: "5% off, skip or pause anytime", tone: { bg: "#F2E1D6", fg: "#7A4F33" } },
  { title: "Cashback", sub: "On every order, never expires", tone: { bg: "#E0E6EE", fg: "#324461" } },
];
