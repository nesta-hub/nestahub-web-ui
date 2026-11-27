import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { PendingExtrasProvider, usePendingExtras } from "@/contexts/PendingExtrasContext";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import { DesktopProductDetailContent } from "./DesktopProductDetailContent";
import { ProductDetailContent } from "./ProductDetailContent";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


/**
 * The product page, mobile and desktop, in both modes: the new Subscribe card when the experience is on, and
 * the old One-Time / Subscribe & Save choice exactly as it was when it is off.
 */

const flag = vi.hoisted(() => ({ on: true }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => flag.on }));
// She has no subscriptions here (the page that shows one she has is tested in ShopProductPage.test.tsx).
vi.mock("@/hooks/useSubscribedItems", () => ({ useSubscribedItems: () => () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { addToCart: vi.fn() } }));

const detailBox = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/hooks/useCatalogue", () => ({ useProductDetail: () => ({ data: detailBox.value, isLoading: false }) }));

const variant = (over: Partial<ProductVariant> & { id: string; size: string; display: string }): ProductVariant => ({
  sku: over.id,
  price: 500_000,
  stock: 10,
  isInStock: true,
  subscriptionPrice: 450_000,
  recommendedFrequencyWeeks: 3,
  isSubscribable: true,
  isActive: true,
  attributes: [{ attributeName: "Size", attributeSlug: "size", value: over.size, displayValue: over.display, sortOrder: 0 }],
  ...over,
});

const DETAIL = {
  id: "p1", name: "Diapers", brand: "Kisskids", slug: "kisskids-diapers", categoryId: "c1", categoryName: "diapers", categoryDisplayName: "Diapers",
  categorySlug: "diapers", minPrice: 500_000, maxPrice: 500_000, variantCount: 2, isInStock: true, isActive: true, createdAt: "", updatedAt: "",
  availableAttributes: { Size: ["small", "medium"] },
  variants: [
    variant({ id: "v-small", size: "small", display: "Small" }),
    variant({ id: "v-medium", size: "medium", display: "Medium", isSubscribable: false }),
  ],
} as unknown as ProductDetail;

function CartProbe() {
  const { items } = useCart();
  return <pre data-testid="cart">{JSON.stringify(items)}</pre>;
}
const cart = () => JSON.parse(screen.getByTestId("cart").textContent ?? "[]") as Array<Record<string, unknown>>;

/**
 * The old way of buying, step by step, differs by page: mobile asks "One-Time Purchase or Subscribe & Save?" after
 * Add to Cart and ends with Done; desktop shows that choice on the page and ends with Add to Cart.
 */
const addTheOldWay = {
  mobile: (subscribe: boolean) => {
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    if (subscribe) fireEvent.click(screen.getByText(/Subscribe & Save/));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
  },
  desktop: (subscribe: boolean) => {
    if (subscribe) fireEvent.click(screen.getByText(/Subscribe & Save/));
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
  },
};

const PAGES = [
  ["mobile", ProductDetailContent],
  ["desktop", DesktopProductDetailContent],
] as const;

describe.each(PAGES)("the %s product page", (_name, Page) => {
  const show = () =>
    render(
      <MemoryRouter>
        <CartProvider>
          <Page productKey="kisskids-diapers" onAdded={() => undefined} />
          <CartProbe />
        </CartProvider>
      </MemoryRouter>,
    );
  const addToCart = () => fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
  const subscribeSwitch = () => screen.getByRole("switch", { name: "Subscribe to this item" });

  beforeEach(() => {
    localStorage.clear();
    detailBox.value = DETAIL;
    flag.on = true;
  });

  describe("with the new experience on", () => {
    it("shows the Subscribe card, off to start with, and not the old choice", () => {
      show();
      expect(subscribeSwitch()).toHaveAttribute("aria-checked", "false");
      expect(screen.queryByText("One-Time Purchase")).not.toBeInTheDocument();
      expect(screen.queryByText("One-Time")).not.toBeInTheDocument();
    });

    it("adds a one-time item straight away, with no second step, saying plainly that it is not a subscription", () => {
      show();
      addToCart();
      expect(cart()).toHaveLength(1);
      expect(cart()[0]).toMatchObject({ variantId: "v-small", quantity: 1, isAutoRenew: false, renewalFrequency: null });
      expect(screen.queryByText("One-Time Purchase")).not.toBeInTheDocument();
    });

    it("adds a subscription with the frequency she chose: how long one lasts to start with", () => {
      show();
      fireEvent.click(subscribeSwitch());
      addToCart();
      expect(cart()[0]).toMatchObject({
        variantId: "v-small", isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: "weeks", every: 3 }, subscriptionPrice: 450_000,
      });
      expect(cart()[0]).not.toHaveProperty("firstRenewalDate");
    });

    it("weekly carries no first renewal day from the shop: it counts from delivery", () => {
      show();
      fireEvent.click(subscribeSwitch());
      expect(screen.queryByRole("button", { name: "Pick a day" })).not.toBeInTheDocument();
      addToCart();
      expect(cart()[0]).toMatchObject({ renewalFrequency: { kind: "weeks", every: 3 } });
      expect(cart()[0].firstRenewalDate).toBeUndefined();
    });

    it("a monthly choice is stored as 4 weeks for the old column", () => {
      show();
      fireEvent.click(subscribeSwitch());
      fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular date" }));
      addToCart();
      expect(cart()[0]).toMatchObject({ isAutoRenew: true, frequencyWeeks: 4, renewalFrequency: { kind: "month_date", day: 25 } });
    });

    it("asks nothing about whether monthly will last", () => {
      show();
      fireEvent.click(subscribeSwitch());
      fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular date" }));
      expect(screen.queryByText(/Sure this will last a month/)).not.toBeInTheDocument();
    });

    it("a size that cannot be subscribed to shows no card, and a choice made on another size does not follow it", () => {
      show();
      fireEvent.click(subscribeSwitch());
      fireEvent.click(screen.getByRole("button", { name: "Medium" }));
      expect(screen.queryByRole("switch", { name: "Subscribe to this item" })).not.toBeInTheDocument();
      addToCart();
      expect(cart()[0]).toMatchObject({ variantId: "v-medium", isAutoRenew: false, renewalFrequency: null });
    });

    it("the last choice wins: adding the same item again as one-time takes the subscription off the line", () => {
      show();
      fireEvent.click(subscribeSwitch());
      addToCart();
      expect(cart()[0]).toMatchObject({ isAutoRenew: true, renewalFrequency: { kind: "weeks", every: 3 } });
      fireEvent.click(subscribeSwitch()); // off again
      addToCart();
      expect(cart()).toHaveLength(1);
      expect(cart()[0]).toMatchObject({ quantity: 2, isAutoRenew: false, renewalFrequency: null });
      expect(cart()[0]).not.toHaveProperty("frequencyWeeks");
    });
  });

  describe("with the new experience off, exactly as before", () => {
    beforeEach(() => {
      flag.on = false;
    });

    it("shows no card and no switch", () => {
      show();
      expect(screen.queryByRole("switch", { name: "Subscribe to this item" })).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Subscribe" })).not.toBeInTheDocument();
    });

    it("one-time adds an item with no new fields at all", () => {
      show();
      addTheOldWay[_name](false);
      expect(cart()).toHaveLength(1);
      expect(cart()[0]).toMatchObject({ variantId: "v-small", isAutoRenew: false });
      expect(cart()[0]).not.toHaveProperty("renewalFrequency");
      expect(cart()[0]).not.toHaveProperty("firstRenewalDate");
    });

    it("subscribe & save adds weeks only, no new fields", () => {
      show();
      addTheOldWay[_name](true);
      expect(cart()[0]).toMatchObject({ isAutoRenew: true, frequencyWeeks: 3 });
      expect(cart()[0]).not.toHaveProperty("renewalFrequency");
      expect(cart()[0]).not.toHaveProperty("firstRenewalDate");
    });
  });
});

/** Shopping for the order she is about to pay: "Add extra items". */
describe.each(PAGES)("the %s product page while adding extra items to an order", (_name, Page) => {
  function Pending() {
    const { boxId, picks, start } = usePendingExtras();
    return (
      <>
        <button type="button" onClick={() => start("box-1")}>start-extras</button>
        <pre data-testid="pending">{JSON.stringify({ boxId, picks })}</pre>
      </>
    );
  }
  const pendingState = () => JSON.parse(screen.getByTestId("pending").textContent ?? "{}") as { boxId: string | null; picks: Array<Record<string, unknown>> };

  const show = () =>
    render(
      <MemoryRouter>
        <CartProvider>
          <PendingExtrasProvider>
            <Page productKey="kisskids-diapers" onAdded={() => undefined} />
            <CartProbe />
            <Pending />
          </PendingExtrasProvider>
        </CartProvider>
      </MemoryRouter>,
    );

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    detailBox.value = DETAIL;
    flag.on = true;
  });

  it("adds to that order, not to the cart, at the price shown, and never offers a subscription", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "start-extras" }));
    expect(screen.queryByRole("switch", { name: "Subscribe to this item" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to pending order" }));
    expect(cart()).toEqual([]);
    expect(pendingState().boxId).toBe("box-1");
    expect(pendingState().picks).toEqual([
      { variantId: "v-small", productName: "Diapers", brand: "Kisskids", variantLabel: "Small", imageUrl: null, unitPriceKobo: 500_000, quantity: 1 },
    ]);
  });

  it("is the ordinary page, with the card and the cart, until she starts", () => {
    show();
    expect(screen.getByRole("switch", { name: "Subscribe to this item" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(cart()).toHaveLength(1);
    expect(pendingState().picks).toEqual([]);
  });

  it("with the experience off, a leftover pending order changes nothing: it is the old page adding to the cart", () => {
    flag.on = false;
    show();
    fireEvent.click(screen.getByRole("button", { name: "start-extras" }));
    expect(screen.queryByRole("button", { name: "Add to pending order" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });
});
