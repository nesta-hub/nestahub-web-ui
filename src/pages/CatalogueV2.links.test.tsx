import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TREE, category } from "@/components/catalogue/v3/testFixtures";
import { forgetOpenedLinks } from "@/components/catalogue/v3/useLinkedCategory";
import CatalogueV2 from "./CatalogueV2";

const state = vi.hoisted(() => ({ mobile: true, tree: undefined as unknown }));
const customEvent = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => state.mobile }));
vi.mock("@/hooks/useCatalogue", () => ({
  useCategoryTree: () => ({ data: state.tree, isLoading: !state.tree }),
  useRecentVariants: () => ({ data: undefined }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ session: null }) }));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { viewContent: vi.fn(), customEvent } }));
vi.mock("@/components/layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/catalogue/v3/DesktopShop", () => ({ DesktopShop: () => <div>desktop shop</div> }));
// What the page tells each part to show is what is under test, not the parts.
vi.mock("@/components/catalogue/v3/MobileShopHome", () => ({
  MobileShopHome: ({ initialGroupSlug, smoothArrival, groups, onCategory }: {
    initialGroupSlug: string | null;
    smoothArrival: boolean;
    groups: typeof TREE;
    onCategory: (c: unknown) => void;
  }) => (
    <div>
      <output aria-label="group">{initialGroupSlug ?? "none"}</output>
      <output aria-label="smooth">{String(smoothArrival)}</output>
      {groups[0] && <button onClick={() => onCategory(groups[0].categories[0])}>first tile</button>}
    </div>
  ),
}));
vi.mock("@/components/catalogue/v2", () => ({
  ReorderDrawer: () => null,
  SearchOverlay: () => null,
  CategoryView: () => null,
  ShopProductDrawer: ({ open, productKey }: { open: boolean; productKey: string }) => (open ? <div>product {productKey}</div> : null),
  CategoryProductsDrawer: ({ open, category: c, onOpenChange }: { open: boolean; category: { displayName: string }; onOpenChange: (o: boolean) => void }) =>
    open ? (
      <div>
        <h2>{c.displayName}</h2>
        <button onClick={() => onOpenChange(false)}>close drawer</button>
      </div>
    ) : null,
}));

beforeEach(() => {
  forgetOpenedLinks();
  customEvent.mockClear();
  state.mobile = true;
  state.tree = { groups: TREE, ungrouped: [category("raincoat", "Raincoats")] };
});

function Controls() {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate(-1)}>back</button>
      <Link to="/shop/baby-care/body-wash">the link again</Link>
      <Link to="/shop">shop</Link>
      <Link to="/cart">cart</Link>
      <Link to="?product=zebra-bib">a product</Link>
    </nav>
  );
}

const page = (address: string) => (
  <MemoryRouter initialEntries={[address]}>
    <Routes>
      {["/shop", "/shop/:groupSlug", "/shop/:groupSlug/:categorySlug"].map((path) => (
        <Route key={path} path={path} element={<CatalogueV2 />} />
      ))}
      <Route path="/cart" element={<div>the cart</div>} />
    </Routes>
    <Controls />
  </MemoryRouter>
);
const show = (address: string) => {
  const view = render(page(address));
  return { again: () => view.rerender(page(address)) };
};
const drawer = () => screen.queryByRole("heading", { level: 2 })?.textContent ?? null;
const group = () => screen.getByLabelText("group").textContent;
const tap = (name: string) => act(() => void fireEvent.click(screen.getByText(name)));

describe("a category's link on a phone", () => {
  it("goes to its group and opens its drawer", () => {
    show("/shop/baby-care/body-wash");

    expect(group()).toBe("baby-care");
    expect(drawer()).toBe("Body Wash");
  });

  it("gets to the group at once, so the drawer does not freeze the page part-way there", () => {
    show("/shop/baby-care/body-wash");

    expect(screen.getByLabelText("smooth")).toHaveTextContent("false");
  });

  it("waits for the categories to load", () => {
    const tree = state.tree;
    state.tree = undefined;
    const { again } = show("/shop/baby-care/body-wash");
    expect(drawer()).toBeNull();

    state.tree = tree;
    again();

    expect(drawer()).toBe("Body Wash");
  });

  it("keeps working once the category has moved to another group", () => {
    show("/shop/health-wellness/body-wash");

    expect(group()).toBe("baby-care");
    expect(drawer()).toBe("Body Wash");
  });

  it("opens a category that is in no group", () => {
    show("/shop/all/raincoat");

    expect(group()).toBe("none");
    expect(drawer()).toBe("Raincoats");
  });

  it("shows the group for a category that is gone, and the whole shop if both are", () => {
    show("/shop/baby-care/gone");
    expect([group(), drawer()]).toEqual(["baby-care", null]);
  });

  it("works with campaign tags on it", () => {
    show("/shop/baby-care/body-wash?utm_source=whatsapp&fbclid=x");

    expect(drawer()).toBe("Body Wash");
  });

  it("counts as a category click that came from a link, once", () => {
    const { again } = show("/shop/baby-care/body-wash");
    again();

    expect(customEvent).toHaveBeenCalledTimes(1);
    expect(customEvent).toHaveBeenCalledWith("CategoryClick", { category_name: "Body Wash", category_id: "body-wash", source: "link" });
  });
});

describe("after closing its drawer", () => {
  it("stays closed, with the shopper left on the group", () => {
    const { again } = show("/shop/baby-care/body-wash");
    tap("close drawer");
    again();

    expect([group(), drawer()]).toEqual(["baby-care", null]);
  });

  it("stays closed when the categories are fetched again", () => {
    const { again } = show("/shop/baby-care/body-wash");
    tap("close drawer");
    state.tree = JSON.parse(JSON.stringify(state.tree));
    again();

    expect(drawer()).toBeNull();
  });

  it("stays closed when a product is opened", () => {
    show("/shop/baby-care/body-wash");
    tap("close drawer");
    tap("a product");

    expect(screen.getByText("product zebra-bib")).toBeInTheDocument();
    expect(drawer()).toBeNull();
  });

  it("stays closed when the shopper comes back from the cart", () => {
    show("/shop/baby-care/body-wash");
    tap("close drawer");
    tap("cart");
    tap("back");

    expect([group(), drawer()]).toEqual(["baby-care", null]);
  });

  it("opens again when the link is followed again", () => {
    show("/shop/baby-care/body-wash");
    tap("close drawer");
    tap("shop");
    expect(drawer()).toBeNull();
    tap("the link again");

    expect(drawer()).toBe("Body Wash");
  });

  it("lets a tile open its own drawer, as a click and not a link", () => {
    show("/shop/baby-care/body-wash");
    tap("close drawer");
    customEvent.mockClear();
    tap("first tile");

    expect(drawer()).toBe("Diaper Collectibles");
    expect(customEvent).toHaveBeenCalledWith("CategoryClick", { category_name: "Diaper Collectibles", category_id: "diaper-collectibles" });
  });
});

describe("other links", () => {
  it("a group's link goes to the group, smoothly, with no drawer", () => {
    show("/shop/baby-care");

    expect([group(), drawer()]).toEqual(["baby-care", null]);
    expect(screen.getByLabelText("smooth")).toHaveTextContent("true");
  });

  it("a link that also names a product opens just the product", () => {
    show("/shop/baby-care/body-wash?product=zebra-bib");

    expect(screen.getByText("product zebra-bib")).toBeInTheDocument();
    expect(drawer()).toBeNull();
  });

  it("on desktop the page decides, and nothing is counted", () => {
    state.mobile = false;
    show("/shop/baby-care/body-wash");

    expect(screen.getByText("desktop shop")).toBeInTheDocument();
    expect(customEvent).not.toHaveBeenCalled();
  });
});
