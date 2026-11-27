import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryProductsDrawer } from "./CategoryProductsDrawer";

const card = { id: "p1", slug: "kisskids-superdry", name: "Superdry baby diaper", brand: "Kisskids", categoryId: "c1", subcategoryId: null, imageUrl: null, minPrice: 350_000, maxPrice: 350_000 };
vi.mock("@/hooks/useCatalogue", () => ({ useCategoryProducts: () => ({ data: { products: [card] }, isLoading: false }) }));
vi.mock("./ProductDetailContent", () => ({ ProductDetailContent: ({ productKey }: { productKey: string }) => <p>details inside the drawer: {productKey}</p> }));

const category = { id: "c1", slug: "diapers", displayName: "Diapers", subcategories: [] };
const show = (onOpenProduct?: (key: string) => void) =>
  render(<CategoryProductsDrawer open onOpenChange={vi.fn()} category={category} onOpenProduct={onOpenProduct} />);
const tapProduct = () => fireEvent.click(screen.getByRole("button", { name: /Kisskids Superdry baby diaper/, hidden: true }));

describe("a product tapped in a category drawer", () => {
  it("with the new Subscribe experience, opens through the shop (as a full page), not inside the drawer", () => {
    const onOpenProduct = vi.fn();
    show(onOpenProduct);
    tapProduct();
    expect(onOpenProduct).toHaveBeenCalledWith("kisskids-superdry");
    expect(screen.queryByText(/details inside the drawer/)).toBeNull();
  });

  it("otherwise opens inside the drawer, as before", () => {
    show();
    tapProduct();
    expect(screen.getByText("details inside the drawer: kisskids-superdry")).toBeInTheDocument();
  });
});
