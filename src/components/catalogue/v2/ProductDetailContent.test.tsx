import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProductDetailContent } from "./ProductDetailContent";

const detail = vi.hoisted(() => ({ product: null as string | null, variant: null as string | null }));
vi.mock("@/hooks/useCatalogue", async () => {
  const { useMemo } = await import("react");
  return {
    useProductDetail: () => ({
      isLoading: false,
      // The same object between renders, as the query cache gives.
      data: useMemo(
        () => ({
          id: "p1",
          name: "Bib",
          brand: "Brand",
          slug: "bib",
          description: detail.product,
          minPrice: 300_000,
          maxPrice: 300_000,
          availableAttributes: { Colour: ["pink"] },
          isActive: true,
          variants: [
            {
              id: "v1",
              price: 300_000,
              isActive: true,
              description: detail.variant,
              attributes: [{ attributeName: "Colour", value: "pink", displayValue: "Pink" }],
            },
          ],
        }),
        [],
      ),
    }),
  };
});
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { addToCart: vi.fn() } }));

function show(descriptions: { product?: string; variant?: string }) {
  detail.product = descriptions.product ?? null;
  detail.variant = descriptions.variant ?? null;
  render(
    <MemoryRouter>
      <ProductDetailContent productKey="bib" onAdded={() => {}} />
    </MemoryRouter>,
  );
}
const link = () => screen.queryByRole("button", { name: /View details/ });
const STOCK_TEXT = /Dermatologically|hypoallergenic|Premium quality|Trusted by/i;

describe("a product's details on a phone", () => {
  it("are the product's own description and nothing else", () => {
    show({ product: "Soft cotton bib." });
    fireEvent.click(link()!);

    expect(screen.getByText("Soft cotton bib.")).toBeInTheDocument();
    expect(screen.queryByText(STOCK_TEXT)).toBeNull();
  });

  it("are the variant's description when it has one", () => {
    show({ product: "Soft cotton bib.", variant: "The pink one." });
    fireEvent.click(link()!);

    expect(screen.getByText("The pink one.")).toBeInTheDocument();
    expect(screen.queryByText("Soft cotton bib.")).toBeNull();
    expect(screen.queryByText(STOCK_TEXT)).toBeNull();
  });

  it.each([".", "-", "  "])("are the product's description when the variant's is a placeholder: %j", (variant) => {
    show({ product: "Soft cotton bib.", variant });
    fireEvent.click(link()!);

    expect(screen.getByText("Soft cotton bib.")).toBeInTheDocument();
  });

  it("can't be opened when there is no description, and the choice still shows", () => {
    show({});

    expect(link()).toBeNull();
    expect(screen.getAllByText("Pink").length).toBeGreaterThan(0);
    expect(screen.queryByText("·")).toBeNull();
  });
});
