import { describe, expect, it } from "vitest";

/**
 * Every main button in the Subscribe screens is the Nesta Hub brown (`bg-shop-cta`, the colour Add to Cart uses),
 * never the near-black `bg-shop-ink` the design file draws them in. This reads the source of those screens, so a
 * new button cannot quietly go back to the dark colour.
 */
const sources = {
  ...import.meta.glob("/src/components/subscription-tab/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/components/subscribe-more/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/components/subscribe-card/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/components/subscribe-offer/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/components/pending-extras/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/pages/Subscribe*.tsx", { query: "?raw", import: "default", eager: true }),
} as Record<string, string>;

const screens = Object.entries(sources).filter(([path]) => !/\.test\.tsx$/.test(path));

describe("the Subscribe screens' buttons", () => {
  it("is reading the screens", () => {
    expect(screens.length).toBeGreaterThan(15);
  });

  // The one exception: "Pay now" on the order card keeps the design's near-black. (The order-placed offer's Subscribe button is the design's translucent white, not a dark one.)
  const allowed: Record<string, number> = { "NextOrderCard.tsx": 1 };

  it.each(screens.map(([path]) => path))("%s has no near-black button (apart from Pay now)", (path) => {
    const count = (sources[path].match(/bg-shop-ink/g) ?? []).length;
    expect(count).toBe(allowed[path.split("/").pop() as string] ?? 0);
  });

  it("uses the Nesta Hub brown for the buttons that carry the main action", () => {
    const withCta = screens.filter(([, source]) => source.includes("bg-shop-cta")).map(([path]) => path.split("/").pop());
    for (const name of ["BottomSheet.tsx", "NextOrderCard.tsx", "UsualBuys.tsx", "SubscribeSetup.tsx", "PendingExtrasBar.tsx", "ExtrasProductPage.tsx", "SubscribeProductPage.tsx"]) {
      expect(withCta).toContain(name);
    }
  });
});
