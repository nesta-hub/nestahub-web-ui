import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/contexts/CartContext";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import { ShopProductPage } from "./ShopProductPage";

const detailBox = vi.hoisted(() => ({ value: null as unknown, loading: false }));
vi.mock("@/hooks/useCatalogue", () => ({ useProductDetail: () => ({ data: detailBox.loading ? undefined : detailBox.value, isLoading: detailBox.loading }) }));
const share = vi.hoisted(() => vi.fn());
vi.mock("@/lib/shareProduct", () => ({ shareProduct: share }));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { addToCart: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mine = vi.hoisted(() => ({ items: [] as Array<Record<string, unknown>> }));
vi.mock("@/hooks/useSubscribedItems", async (original) => ({
  ...(await original<typeof import("@/hooks/useSubscribedItems")>()),
  useSubscribedItems: () => (variantId: string | undefined) => mine.items.find((i) => i.variantId === variantId) ?? null,
}));

const variant = (id: string, type: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  id, sku: id, price: 350_000, stock: 5, isInStock: true, isSubscribable: true, isActive: true, imageUrl: undefined,
  subscriptionPrice: 332_500, recommendedFrequencyWeeks: 2,
  attributes: [
    { attributeName: "Type", attributeSlug: "type", value: type, displayValue: type[0].toUpperCase() + type.slice(1), sortOrder: 0 },
    { attributeName: "Size", attributeSlug: "size", value: size, displayValue: `Size ${size}`, sortOrder: 1 },
  ],
  ...over,
}) as ProductVariant;

const detail = (over: Partial<ProductDetail> = {}): ProductDetail =>
  ({
    id: "p1", name: "Superdry baby diaper", brand: "Kisskids", slug: "kisskids-superdry", description: "Soft and dry.", imageUrl: undefined, categoryId: "c", minPrice: 1, maxPrice: 2,
    variants: [variant("eco-2", "eco", "2"), variant("eco-3", "eco", "3"), variant("jumbo-3", "jumbo", "3", { isSubscribable: false, subscriptionPrice: undefined })],
    availableAttributes: { Type: ["eco", "jumbo"], Size: ["2", "3"] },
    ...over,
  }) as unknown as ProductDetail;

function CartProbe() {
  const { items } = useCart();
  return <output data-testid="cart">{JSON.stringify(items)}</output>;
}
const cart = () => JSON.parse(screen.getByTestId("cart").textContent ?? "[]") as Array<Record<string, unknown>>;

function show() {
  const onBack = vi.fn();
  const onAdded = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CartProvider>
          <ShopProductPage productKey="kisskids-superdry" onBack={onBack} onAdded={onAdded} />
          <CartProbe />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onBack, onAdded };
}
const page = () => within(screen.getByRole("dialog", { name: "Kisskids Superdry baby diaper" }));
const cta = () => page().getByRole("button", { name: /^(Add to cart|Unavailable)/ });

beforeEach(() => {
  vi.clearAllMocks();
  mine.items = [];
  localStorage.clear();
  detailBox.value = detail();
  detailBox.loading = false;
});

describe("the shop's product page (full screen)", () => {
  it("has Back, Share and the cart along the top, then the picture, name, type and size, and price", () => {
    show();
    expect(page().getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(page().getByRole("button", { name: "Share product" })).toBeInTheDocument();
    expect(page().getByRole("button", { name: "Open cart with 0 items" })).toBeInTheDocument();
    expect(page().getByRole("heading", { name: "Kisskids Superdry baby diaper" })).toBeInTheDocument();
    expect(page().getByText("Eco · Size 2")).toBeInTheDocument();
    expect(page().getByText("₦3,500", { selector: "p" })).toBeInTheDocument();
  });

  it("Back closes it; Share shares it", () => {
    const h = show();
    fireEvent.click(page().getByRole("button", { name: "Share product" }));
    expect(share).toHaveBeenCalledWith("Kisskids Superdry baby diaper", "kisskids-superdry");
    fireEvent.click(page().getByRole("button", { name: "Back" }));
    expect(h.onBack).toHaveBeenCalled();
  });

  it("says so while it loads", () => {
    detailBox.loading = true;
    show();
    expect(screen.getByText("Loading product…")).toBeInTheDocument();
  });
});

describe("Subscribe on the shop's product page", () => {
  it("starts switched off: the button adds to the cart at the regular price, with no frequency to pick", () => {
    show();
    expect(page().getByRole("switch", { name: "Subscribe to this item" })).toHaveAttribute("aria-checked", "false");
    expect(page().queryByText("Renewal frequency")).toBeNull();
    expect(cta()).toHaveTextContent("Add to cart₦3,500");
    expect(cta()).toHaveClass("bg-shop-cta");
  });

  it("shows what she would pay subscribed, and switched on asks how often and adds to the cart subscribed", () => {
    show();
    expect(page().getByText("and pay ₦3,325")).toBeInTheDocument();
    fireEvent.click(page().getByRole("switch", { name: "Subscribe to this item" }));
    expect(page().getByText("Renewal frequency")).toBeInTheDocument();
    expect(cta()).toHaveTextContent("Add to cart & subscribe₦3,325");
  });

  it("'Learn more' opens how Subscribe works in a bottom drawer", () => {
    show();
    fireEvent.click(page().getByRole("button", { name: "Learn more" }));
    expect(screen.getByRole("dialog", { name: "How Subscribe works" })).toBeInTheDocument();
    expect(screen.getByText("We remind you")).toBeInTheDocument();
  });

  it("switched on, asks how often but no first renewal day (from the shop it counts from delivery), and no month question", () => {
    show();
    fireEvent.click(page().getByRole("switch", { name: "Subscribe to this item" }));
    fireEvent.click(page().getByRole("radio", { name: "Monthly, on a particular date" }));
    fireEvent.click(page().getByRole("radio", { name: "Every few weeks" }));
    expect(page().queryByText("First renewal")).toBeNull();
    expect(page().queryByText(/Sure this will last a month/)).toBeNull();
  });

  it("switched on, scrolls so the whole card shows above the pinned button; switched off, stays put", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    show();
    fireEvent.click(page().getByRole("switch", { name: "Subscribe to this item" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "end" });
    expect(scrollIntoView.mock.instances[0]).toBe(page().getByRole("region", { name: "Subscribe" }));
    fireEvent.click(page().getByRole("switch", { name: "Subscribe to this item" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("'Learn more': three points with no lines between them, and a plain 'Got it' that closes it", () => {
    show();
    fireEvent.click(page().getByRole("button", { name: "Learn more" }));
    const drawer = within(screen.getByRole("dialog", { name: "How Subscribe works" }));
    const points = drawer.getAllByRole("listitem");
    expect(points).toHaveLength(3);
    for (const point of points) expect(point.className).not.toMatch(/border/);
    const gotIt = drawer.getByRole("button", { name: "Got it" });
    expect(gotIt.querySelector("svg")).toBeNull();
    expect(gotIt).toHaveClass("bg-shop-cta");
  });

  it("is not offered for a type or size that cannot be subscribed to", () => {
    show();
    fireEvent.click(within(page().getByRole("group", { name: "Size" })).getByRole("button", { name: "Size 3" }));
    fireEvent.click(within(page().getByRole("group", { name: "Type" })).getByRole("button", { name: "Jumbo" }));
    expect(page().queryByRole("region", { name: "Subscribe" })).toBeNull();
    expect(cta()).toHaveTextContent("Add to cart");
  });
});

describe("adding to the cart", () => {
  it("switched off: a one-time line, at the regular price, how many she chose; the page closes", () => {
    const h = show();
    fireEvent.click(page().getByRole("button", { name: "More" }));
    fireEvent.click(cta());
    expect(cart()).toHaveLength(1);
    expect(cart()[0]).toMatchObject({ variantId: "eco-2", quantity: 2, unitPrice: 350_000, isAutoRenew: false, renewalFrequency: null });
    expect(h.onAdded).toHaveBeenCalled();
  });

  it("switched on: the line carries how often she chose (by default, how long what she picked lasts)", () => {
    show();
    fireEvent.click(page().getByRole("switch", { name: "Subscribe to this item" }));
    fireEvent.click(cta());
    expect(cart()[0]).toMatchObject({ variantId: "eco-2", isAutoRenew: true, renewalFrequency: { kind: "weeks", every: 2 } });
  });
});

describe("something she already subscribes to (this type and size)", () => {
  const existing = (over: Record<string, unknown> = {}) => ({
    id: "s1", status: "active", variantId: "eco-2", quantity: 2, frequencyLabel: "Every 3 weeks", nextDue: "2026-12-22", ...over,
  });

  it("shows her subscription in place of the switch, with a way to manage it on the Subscription tab", () => {
    mine.items = [existing()];
    show();
    const card = within(page().getByRole("region", { name: "Your subscription" }));
    expect(card.getByText("You subscribe to this")).toBeInTheDocument();
    expect(card.getByText("Quantity 2 · Every 3 weeks · Due: Tue 22 Dec")).toBeInTheDocument();
    expect(card.getByRole("link", { name: "View subscription" })).toHaveAttribute("href", "/subscriptions");
    expect(page().queryByRole("switch", { name: "Subscribe to this item" })).toBeNull();
  });

  it("says Paused for a paused one", () => {
    mine.items = [existing({ status: "paused" })];
    show();
    expect(page().getByText("Quantity 2 · Every 3 weeks · Paused")).toBeInTheDocument();
  });

  it("can still be bought once, at the regular price, and never as a second subscription", () => {
    mine.items = [existing()];
    show();
    expect(cta()).toHaveTextContent("Add to cart₦3,500");
    fireEvent.click(cta());
    expect(cart()[0]).toMatchObject({ variantId: "eco-2", isAutoRenew: false, renewalFrequency: null });
  });

  it("another size is its own item: the switch is offered for it", () => {
    mine.items = [existing()];
    show();
    fireEvent.click(within(page().getByRole("group", { name: "Size" })).getByRole("button", { name: "Size 3" }));
    expect(page().queryByRole("region", { name: "Your subscription" })).toBeNull();
    expect(page().getByRole("switch", { name: "Subscribe to this item" })).toBeInTheDocument();
  });
});
