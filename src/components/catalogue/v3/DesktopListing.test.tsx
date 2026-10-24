import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductCard } from "@/lib/api";
import { DesktopListing } from "./DesktopListing";
import { priceLabel, sortProducts } from "./listingHelpers";
import { TREE, product } from "./testFixtures";

const useCategoryProducts = vi.fn();
vi.mock("@/hooks/useCatalogue", () => ({ useCategoryProducts: (...args: unknown[]) => useCategoryProducts(...args) }));

const PRODUCTS: ProductCard[] = [
  product("zebra-bib", "Zebra bib", 300_000),
  product("apple-cup", "Apple cup", 150_000, { maxPrice: 250_000 }),
  product("mango-bowl", "Mango bowl", 450_000),
];

beforeEach(() => {
  useCategoryProducts.mockReset();
  useCategoryProducts.mockReturnValue({ data: { products: PRODUCTS }, isLoading: false });
});

function show(props: Partial<React.ComponentProps<typeof DesktopListing>> = {}) {
  const onProduct = vi.fn();
  render(
    <MemoryRouter>
      <DesktopListing groups={TREE} loading={false} groupSlug="baby-care" onProduct={onProduct} {...props} />
    </MemoryRouter>,
  );
  return { onProduct };
}

const names = () => screen.getAllByRole("article").map((a) => within(a).getAllByRole("button")[0].textContent ?? "");

describe("a group's page", () => {
  it("asks for the whole group's products in one go", () => {
    show();

    expect(useCategoryProducts).toHaveBeenCalledWith({ category: undefined, group: "baby-care", enabled: true });
  });

  it("shows the group's name, a line about it and how many products there are", () => {
    show();

    expect(screen.getByRole("heading", { level: 1, name: "Body Care" })).toBeInTheDocument();
    expect(screen.getByText("Everything we stock in Body Care.")).toBeInTheDocument();
    expect(screen.getByText("3 products")).toBeInTheDocument();
  });

  it("says '1 product' for one", () => {
    useCategoryProducts.mockReturnValue({ data: { products: [PRODUCTS[0]] }, isLoading: false });
    show();

    expect(screen.getByText("1 product")).toBeInTheDocument();
  });

  it("has a chip for All and each category, All marked", () => {
    show();
    const chips = within(screen.getByRole("navigation", { name: "Categories" }));

    expect(chips.getAllByRole("link").map((l) => l.textContent)).toEqual(["All", "Diaper Collectibles", "Body Wash"]);
    expect(chips.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
    expect(chips.getByRole("link", { name: "Body Wash" })).toHaveAttribute("href", "/shop/baby-care/body-wash");
    expect(chips.getByRole("link", { name: "All" })).toHaveAttribute("href", "/shop/baby-care");
  });

  it("trims the group's name when it was saved with a trailing space", () => {
    show({ groupSlug: "back-to-school" });

    expect(screen.getByRole("heading", { level: 1, name: "Learning Resource" })).toBeInTheDocument();
  });
});

describe("a category's page", () => {
  it("asks for that category's products, not the group's", () => {
    show({ categorySlug: "body-wash" });

    expect(useCategoryProducts).toHaveBeenCalledWith({ category: "body-wash", group: undefined, enabled: true });
  });

  it("is headed by the category, marked in the chips, and says which group it is part of", () => {
    show({ categorySlug: "body-wash" });

    expect(screen.getByRole("heading", { level: 1, name: "Body Wash" })).toBeInTheDocument();
    expect(screen.getByText("Part of Body Care.")).toBeInTheDocument();
    const chips = within(screen.getByRole("navigation", { name: "Categories" }));
    expect(chips.getByRole("link", { name: "Body Wash" })).toHaveAttribute("aria-current", "page");
    expect(chips.getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
  });
});

describe("the products", () => {
  it("shows a card for each, with its brand, name and price", () => {
    show();

    expect(names()).toHaveLength(3);
    expect(screen.getByText("Zebra bib")).toBeInTheDocument();
    expect(screen.getByText("₦3,000")).toBeInTheDocument();
    expect(screen.getByText("from ₦1,500")).toBeInTheDocument(); // priced differently by variant
  });

  it("keeps the order they come in under Featured", () => {
    show();

    expect(names().map((n) => n.replace(/Brand|₦.*|from.*/g, "").trim())).toEqual(["Zebra bib", "Apple cup", "Mango bowl"].map((n) => n));
  });

  it("sorts by price, low to high and high to low", () => {
    show();
    const select = screen.getByLabelText("Sort by");

    fireEvent.change(select, { target: { value: "low" } });
    expect(screen.getAllByRole("article").map((a) => a.textContent)).toEqual([
      expect.stringContaining("Apple cup"),
      expect.stringContaining("Zebra bib"),
      expect.stringContaining("Mango bowl"),
    ]);

    fireEvent.change(select, { target: { value: "high" } });
    expect(screen.getAllByRole("article")[0].textContent).toContain("Mango bowl");
  });

  it("sorts by name", () => {
    show();

    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "az" } });

    expect(screen.getAllByRole("article")[0].textContent).toContain("Apple cup");
    expect(screen.getAllByRole("article")[2].textContent).toContain("Zebra bib");
  });

  it("opens a product, from its card or its plus button", () => {
    const { onProduct } = show();

    fireEvent.click(within(screen.getAllByRole("article")[0]).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "View Apple cup" }));

    expect(onProduct).toHaveBeenNthCalledWith(1, "zebra-bib");
    expect(onProduct).toHaveBeenNthCalledWith(2, "apple-cup");
  });
});

describe("while loading, when empty and when it is not there", () => {
  it("shows placeholders while the products load, with no count", () => {
    useCategoryProducts.mockReturnValue({ data: undefined, isLoading: true });
    show();

    expect(screen.getByRole("status", { name: "Loading products" })).toBeInTheDocument();
    expect(screen.queryByText(/products?$/)).toBeNull();
  });

  it("says so when there is nothing in it", () => {
    useCategoryProducts.mockReturnValue({ data: { products: [] }, isLoading: false });
    show();

    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
    expect(screen.getByText("0 products")).toBeInTheDocument();
  });

  it("says a group is not there, with a way back", () => {
    show({ groupSlug: "no-such-group" });

    expect(screen.getByRole("heading", { name: "We couldn't find that" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the shop" })).toHaveAttribute("href", "/shop");
  });

  it("says a category is not there when it is not in that group", () => {
    show({ categorySlug: "no-such-category" });

    expect(screen.getByRole("heading", { name: "We couldn't find that" })).toBeInTheDocument();
  });

  it("does not say not found while the groups themselves are still loading", () => {
    show({ groups: [], loading: true });

    expect(screen.queryByText("We couldn't find that")).toBeNull();
    expect(useCategoryProducts).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});

describe("sorting and pricing, on their own", () => {
  it("never changes the list it was given", () => {
    const before = PRODUCTS.map((p) => p.slug);

    sortProducts(PRODUCTS, "az");

    expect(PRODUCTS.map((p) => p.slug)).toEqual(before);
  });

  it("puts a 'from' on a price that varies and not on one that does not", () => {
    expect(priceLabel({ minPrice: 110_000, maxPrice: 110_000 })).toBe("₦1,100");
    expect(priceLabel({ minPrice: 110_000, maxPrice: 150_000 })).toBe("from ₦1,100");
  });
});
