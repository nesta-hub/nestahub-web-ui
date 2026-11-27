import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { PendingExtrasProvider, usePendingExtras } from "@/contexts/PendingExtrasContext";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import { ExtrasProductPage } from "./ExtrasProductPage";

const detailBox = vi.hoisted(() => ({ value: null as unknown, loading: false }));
vi.mock("@/hooks/useCatalogue", () => ({ useProductDetail: () => ({ data: detailBox.loading ? undefined : detailBox.value, isLoading: detailBox.loading }) }));
const share = vi.hoisted(() => vi.fn());
vi.mock("@/lib/shareProduct", () => ({ shareProduct: share }));

const variant = (id: string, type: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  id, sku: id, price: 650_000, stock: 5, isInStock: true, isSubscribable: false, isActive: true, imageUrl: undefined,
  attributes: [
    { attributeName: "Type", attributeSlug: "type", value: type, displayValue: type[0].toUpperCase() + type.slice(1), sortOrder: 0 },
    { attributeName: "Size", attributeSlug: "size", value: size, displayValue: `Size ${size}`, sortOrder: 1 },
  ],
  ...over,
});

const LONG = "Soft, breathable diapers with a snug stretch waistband, made to keep your baby dry and comfortable day and night.";
const detail = (over: Partial<ProductDetail> = {}): ProductDetail =>
  ({
    id: "p1", name: "Superdry baby diaper", brand: "Kisskids", slug: "kisskids-superdry", description: LONG, imageUrl: undefined, categoryId: "c", minPrice: 1, maxPrice: 2,
    variants: [variant("eco-2", "eco", "2"), variant("eco-3", "eco", "3"), variant("jumbo-3", "jumbo", "3", { price: 950_000 }), variant("jumbo-4", "jumbo", "4", { price: 950_000 }), variant("old-5", "eco", "5", { isActive: false })],
    availableAttributes: { Type: ["eco", "jumbo"], Size: ["2", "3", "4", "5"] },
    ...over,
  }) as unknown as ProductDetail;

function Probe() {
  const { boxId, picks } = usePendingExtras();
  const { items } = useCart();
  return (
    <output>
      <span>for:{boxId ?? "nothing"}</span> <span>cart:{items.length}</span> <span data-testid="picks">{JSON.stringify(picks)}</span>
    </output>
  );
}
function Start() {
  const { start } = usePendingExtras();
  const done = useRef(false);
  useLayoutEffect(() => {
    if (!done.current) {
      done.current = true;
      start("b1");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
const picks = () => JSON.parse(screen.getByTestId("picks").textContent ?? "[]") as Array<Record<string, unknown>>;

function show() {
  const onBack = vi.fn();
  const onAdded = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CartProvider>
          <PendingExtrasProvider>
            <Start />
            <ExtrasProductPage productKey="kisskids-superdry" onBack={onBack} onAdded={onAdded} />
            <Probe />
          </PendingExtrasProvider>
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onBack, onAdded };
}
const group = (name: string) => within(screen.getByRole("group", { name }));
const pressed = (name: string) => group(name).getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
const addButton = () => screen.getByRole("button", { name: /^Add to pending order/ });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  detailBox.value = detail();
  detailBox.loading = false;
});

describe("the product page while adding extra items", () => {
  it("is a full page with a Back and a Share, the picture, the name, which type and size, and the price", () => {
    show();
    const page = within(screen.getByRole("dialog", { name: "Kisskids Superdry baby diaper" }));
    expect(page.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(page.getByRole("button", { name: "Share product" })).toBeInTheDocument();
    expect(page.getByRole("button", { name: "View larger image" })).toBeInTheDocument();
    expect(page.getByRole("heading", { name: "Kisskids Superdry baby diaper" })).toBeInTheDocument();
    expect(page.getByText("Eco · Size 2")).toBeInTheDocument();
    expect(page.getAllByText("₦6,500").length).toBeGreaterThan(0);
  });

  it("has a Type group and a Size group, as every product page does, with the first variant picked and only what is on sale", () => {
    show();
    expect(group("Type").getAllByRole("button").map((b) => b.textContent)).toEqual(["Eco", "Jumbo"]);
    expect(group("Size").getAllByRole("button").map((b) => b.textContent)).toEqual(["Size 2", "Size 3", "Size 4"]); // 5 is not on sale
    expect(pressed("Type")).toEqual(["Eco"]);
    expect(pressed("Size")).toEqual(["Size 2"]);
  });

  it("greys out a size that does not come in the picked type", () => {
    show();
    expect(group("Size").getByRole("button", { name: "Size 4" })).toBeDisabled(); // Eco comes in 2 and 3
    fireEvent.click(group("Size").getByRole("button", { name: "Size 3" }));
    fireEvent.click(group("Type").getByRole("button", { name: "Jumbo" }));
    expect(group("Size").getByRole("button", { name: "Size 4" })).toBeEnabled();
    expect(group("Size").getByRole("button", { name: "Size 2" })).toBeDisabled();
    expect(screen.getByText("Jumbo · Size 3")).toBeInTheDocument();
  });

  it("the price and the button follow the type and how many", () => {
    show();
    expect(addButton()).toHaveTextContent("Add to pending order₦6,500");
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(addButton()).toHaveTextContent("Add to pending order₦19,500"); // 3 x ₦6,500
    fireEvent.click(group("Size").getByRole("button", { name: "Size 3" }));
    fireEvent.click(group("Type").getByRole("button", { name: "Jumbo" }));
    expect(addButton()).toHaveTextContent("Add to pending order₦28,500"); // 3 x ₦9,500
  });

  it("starts at 1, never goes below 1, and stops at 20 (what an order can hold)", () => {
    show();
    expect(screen.getByRole("button", { name: "Fewer" })).toBeDisabled();
    for (let i = 0; i < 30; i++) fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Fewer" }));
    expect(screen.getByText("19")).toBeInTheDocument();
  });

  it("says it is for this order only and does not change her subscription", () => {
    show();
    expect(screen.getByText("This item is added to this order only. It does not change your subscription.")).toBeInTheDocument();
  });

  it("is in the Nesta Hub brown, with an arrow", () => {
    show();
    expect(addButton()).toHaveClass("bg-shop-cta");
    expect(addButton().querySelector("svg")).not.toBeNull();
  });
});

describe("adding", () => {
  it("puts it with her extras, at the regular price and how many, with its size, and goes back to the shop", () => {
    const { onAdded } = show();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(addButton());
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(picks()).toEqual([
      { variantId: "eco-2", productName: "Superdry baby diaper", brand: "Kisskids", variantLabel: "Eco · Size 2", imageUrl: null, unitPriceKobo: 650_000, quantity: 2 },
    ]);
  });

  it("does not touch her cart", () => {
    show();
    fireEvent.click(addButton());
    expect(screen.getByText("cart:0")).toBeInTheDocument();
  });

  it("the type and size she picked are what is added", () => {
    show();
    fireEvent.click(group("Size").getByRole("button", { name: "Size 3" }));
    fireEvent.click(group("Type").getByRole("button", { name: "Jumbo" }));
    fireEvent.click(addButton());
    expect(picks()[0]).toMatchObject({ variantId: "jumbo-3", variantLabel: "Jumbo · Size 3", unitPriceKobo: 950_000 });
  });

  it("adding the same thing again adds to how many", () => {
    show();
    fireEvent.click(addButton());
    fireEvent.click(addButton());
    expect(picks()).toHaveLength(1);
    expect(picks()[0].quantity).toBe(2);
  });

  it("cannot add while no variant is picked (a combination that does not exist)", () => {
    detailBox.value = detail({ variants: [variant("only", "eco", "2")] as never, availableAttributes: { Type: ["eco", "jumbo"], Size: ["2", "3"] } });
    show();
    // Jumbo has no variant at all, so it cannot be picked; Eco is picked and fine.
    expect(group("Type").queryByRole("button", { name: "Jumbo" })).toBeNull();
    expect(addButton()).toBeEnabled();
  });
});

describe("leaving", () => {
  it("Back goes back to the shop, adding nothing", () => {
    const { onBack, onAdded } = show();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onAdded).not.toHaveBeenCalled();
    expect(picks()).toEqual([]);
  });

  it("Share shares this product", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Share product" }));
    expect(share).toHaveBeenCalledWith("Kisskids Superdry baby diaper", "kisskids-superdry");
  });
});

describe("the description and the picture", () => {
  it("folds a long description to two lines with '…more', and opens it with 'less' to close", () => {
    show();
    expect(screen.getByRole("button", { name: "Read the full description" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "less" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Read the full description" }));
    expect(screen.getByRole("button", { name: "less" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "less" }));
    expect(screen.getByRole("button", { name: "Read the full description" })).toBeInTheDocument();
  });

  it("leaves a short description whole, with no '…more'", () => {
    detailBox.value = detail({ description: "Soft and dry." });
    show();
    expect(screen.getByText("Soft and dry.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Read the full description" })).toBeNull();
  });

  it("shows nothing for a product with no description", () => {
    detailBox.value = detail({ description: undefined });
    show();
    expect(screen.queryByRole("button", { name: "Read the full description" })).toBeNull();
  });

  it("opens the picture larger, and closes it", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "View larger image" }));
    fireEvent.click(screen.getByRole("button", { name: "Close magnified image" }));
    expect(screen.queryByRole("button", { name: "Close magnified image" })).toBeNull();
  });
});

describe("while it loads", () => {
  it("says so", () => {
    detailBox.loading = true;
    show();
    expect(screen.getByText("Loading product…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Add to pending order/ })).toBeNull();
  });
});
