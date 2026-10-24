import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopShop } from "./DesktopShop";
import { TREE, product } from "./testFixtures";

vi.mock("@/hooks/useCatalogue", () => ({
  useCategoryTree: () => ({ data: { groups: TREE, ungrouped: [] }, isLoading: false }),
  useCategoryProducts: () => ({ data: { products: [product("zebra-bib", "Zebra bib", 300_000)] }, isLoading: false }),
}));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { viewContent: vi.fn(), customEvent: vi.fn() } }));
// The old desktop file also holds the search results and the Buy again panel; stand-ins keep this about routing.
vi.mock("@/components/catalogue/v2/DesktopCatalogueView", () => ({
  DesktopSearchResults: ({ query, onProductClick }: { query: string; onProductClick: (p: { id: string }, raw: { slug: string }) => void }) => (
    <div>
      results for {query}
      <button type="button" onClick={() => onProductClick({ id: "p1" }, { slug: "found-bib" })}>
        pick a result
      </button>
    </div>
  ),
  ReorderSidePanel: ({ open, onOpenChange, onProductClick }: { open: boolean; onOpenChange: (o: boolean) => void; onProductClick: (slug: string) => void }) =>
    open ? (
      <div>
        buy again panel
        <button type="button" onClick={() => onOpenChange(false)}>close buy again</button>
        <button type="button" onClick={() => onProductClick("bought-before")}>pick bought item</button>
      </div>
    ) : null,
}));
vi.mock("./ProductSheet", () => ({
  ProductSheet: ({ productKey, onClose }: { productKey: string | null; onClose: () => void }) =>
    productKey ? (
      <div>
        sheet for {productKey}
        <button type="button" onClick={onClose}>close sheet</button>
      </div>
    ) : null,
}));

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

function Where() {
  const l = useLocation();
  return <output aria-label="address">{l.pathname + l.search}</output>;
}

const show = (address: string) =>
  render(
    <MemoryRouter initialEntries={[address]}>
      <Routes>
        {["/shop", "/shop/:groupSlug", "/shop/:groupSlug/:categorySlug"].map((path) => (
          <Route key={path} path={path} element={<DesktopShop />} />
        ))}
      </Routes>
      <Where />
    </MemoryRouter>,
  );

const address = () => screen.getByLabelText("address").textContent;
const onHome = () => !!screen.queryByRole("heading", { name: "Browse every category" });

describe("what the address shows", () => {
  it("is the shop home at /shop", () => {
    show("/shop");

    expect(onHome()).toBe(true);
  });

  it("is a group's page at /shop/:group", () => {
    show("/shop/baby-care");

    expect(screen.getByRole("heading", { level: 1, name: "Body Care" })).toBeInTheDocument();
    expect(onHome()).toBe(false);
  });

  it("is a category's page at /shop/:group/:category", () => {
    show("/shop/baby-care/body-wash");

    expect(screen.getByRole("heading", { level: 1, name: "Body Wash" })).toBeInTheDocument();
  });

  it("is search results when there is a query, in place of the home", () => {
    show("/shop?q=bib");

    expect(screen.getByText(/results for bib/)).toBeInTheDocument();
    expect(onHome()).toBe(false);
  });

  it("is search results in place of a listing too", () => {
    show("/shop/baby-care?q=bib");

    expect(screen.getByText(/results for bib/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Body Care" })).toBeNull();
  });

  it("ignores a query that is only spaces", () => {
    show("/shop?q=%20%20");

    expect(onHome()).toBe(true);
  });
});

describe("opening a product", () => {
  it("shows the product named in the address, over whatever is showing", () => {
    show("/shop/baby-care?product=zebra-bib");

    expect(screen.getByText("sheet for zebra-bib")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Body Care" })).toBeInTheDocument();
  });

  it("puts a tapped product in the address, so it can be shared and the back button closes it", () => {
    show("/shop/baby-care");

    fireEvent.click(screen.getByRole("button", { name: "View Zebra bib" }));

    expect(address()).toBe("/shop/baby-care?product=zebra-bib");
    expect(screen.getByText("sheet for zebra-bib")).toBeInTheDocument();
  });

  it("takes it out of the address when closed, keeping the rest", () => {
    show("/shop/baby-care?product=zebra-bib&q=");

    fireEvent.click(screen.getByRole("button", { name: "close sheet" }));

    expect(address()).toBe("/shop/baby-care?q=");
    expect(screen.queryByText(/sheet for/)).toBeNull();
  });

  it("opens a search result without losing the search", () => {
    show("/shop?q=bib");

    fireEvent.click(screen.getByRole("button", { name: "pick a result" }));

    expect(address()).toBe("/shop?q=bib&product=found-bib");
    expect(screen.getByText(/results for bib/)).toBeInTheDocument();
  });
});

describe("Buy again", () => {
  it("opens when the address says so", () => {
    show("/shop?reorder=1");

    expect(screen.getByText("buy again panel")).toBeInTheDocument();
  });

  it("is closed otherwise", () => {
    show("/shop");

    expect(screen.queryByText("buy again panel")).toBeNull();
  });

  it("takes itself out of the address when closed", () => {
    show("/shop?reorder=1");

    fireEvent.click(screen.getByRole("button", { name: "close buy again" }));

    expect(address()).toBe("/shop");
  });

  it("swaps for the product when one is picked from it", () => {
    show("/shop?reorder=1");

    fireEvent.click(screen.getByRole("button", { name: "pick bought item" }));

    expect(address()).toBe("/shop?product=bought-before");
    expect(screen.queryByText("buy again panel")).toBeNull();
    expect(within(document.body).getByText("sheet for bought-before")).toBeInTheDocument();
  });
});
