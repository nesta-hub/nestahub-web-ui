import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import type { SubscribedItem } from "@/lib/subscriptionBoxes";
import { ItemDrawer } from "./ItemDrawer";

const getProduct = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async (original) => ({ ...(await original<typeof import("@/lib/api")>()), api: { getProduct } }));

const variant = (id: string, type: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  id, sku: id, price: 500_000, stock: 5, isInStock: true, isSubscribable: true, isActive: true,
  attributes: [
    { attributeName: "Type", attributeSlug: "type", value: type, displayValue: type[0].toUpperCase() + type.slice(1), sortOrder: 0 },
    { attributeName: "Size", attributeSlug: "size", value: size, displayValue: `Size ${size}`, sortOrder: 1 },
  ],
  ...over,
});
const diapers = (variants: ProductVariant[], available: Record<string, string[]>) =>
  ({ id: "p1", name: "Kisskids Superdry baby diaper", brand: "Kisskids", slug: "diapers", categoryId: "c", minPrice: 1, maxPrice: 2, variants, availableAttributes: available } as unknown as ProductDetail);

const DIAPERS = diapers(
  [
    variant("small-2", "small", "2"),
    variant("small-3", "small", "3"),
    variant("jumbo-3", "jumbo", "3"),
    variant("jumbo-4", "jumbo", "4"),
    variant("eco-3", "eco", "3", { isSubscribable: false }),
  ],
  { Type: ["small", "eco", "jumbo"], Size: ["2", "3", "4"] },
);

const item = (over: Partial<SubscribedItem> = {}): SubscribedItem => ({
  id: "s1", status: "active", variantId: "jumbo-3", productId: "p1", productName: "Kisskids Superdry baby diaper", brand: "Kisskids", slug: "diapers",
  variantLabel: "Jumbo · Size 3", imageUrl: null, quantity: 2, unitPriceKobo: 450_000, regularPriceKobo: 500_000, subscriptionPriceKobo: 450_000,
  recommendedFrequencyWeeks: 2, frequency: { kind: "weeks", every: 4 }, frequencyLabel: "Every 4 weeks", nextDue: "2026-11-25", boxId: null, problem: null, enrolSource: null, ...over,
});

function show(over: Partial<SubscribedItem> = {}) {
  const onVariant = vi.fn().mockResolvedValue(true);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ItemDrawer item={item(over)} open busy={false} onClose={vi.fn()} onQuantity={vi.fn()} onVariant={onVariant} onFrequency={vi.fn()} onPause={vi.fn()} onResume={vi.fn()} onStop={vi.fn()} />
    </QueryClientProvider>,
  );
  return { onVariant };
}
const openSize = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Change size/ }));
  await screen.findByText("Change size", { selector: "p" });
};
const group = (name: string) => within(screen.getByRole("group", { name }));
const pressed = (name: string) => group(name).getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
const save = () => screen.getByRole("button", { name: "Save" });

beforeEach(() => {
  vi.clearAllMocks();
  getProduct.mockResolvedValue(DIAPERS);
});

describe("Change size, like choosing a variant on the product page", () => {
  it("has a Type group and a Size group of pills, with what she has now picked in each", async () => {
    show();
    await openSize();
    await screen.findByRole("group", { name: "Type" });
    expect(group("Type").getAllByRole("button").map((b) => b.textContent)).toEqual(["Small", "Jumbo"]);
    expect(group("Size").getAllByRole("button").map((b) => b.textContent)).toEqual(["Size 2", "Size 3", "Size 4"]);
    expect(pressed("Type")).toEqual(["Jumbo"]);
    expect(pressed("Size")).toEqual(["Size 3"]);
    expect(screen.getByText("Type", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Size", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Pick the type and the size. This changes your next order and the ones after it.")).toBeInTheDocument();
  });

  it("offers only what can be subscribed to: a type nobody can subscribe to (Eco) is not there", async () => {
    show();
    await openSize();
    await screen.findByRole("group", { name: "Type" });
    expect(group("Type").queryByRole("button", { name: "Eco" })).toBeNull();
  });

  it("greys out a size that does not come in the picked type, as the product page does", async () => {
    show();
    await openSize();
    await screen.findByRole("group", { name: "Size" });
    // Jumbo is picked: it comes in sizes 3 and 4, not 2.
    expect(group("Size").getByRole("button", { name: "Size 2" })).toBeDisabled();
    expect(group("Size").getByRole("button", { name: "Size 3" })).toBeEnabled();
    expect(group("Size").getByRole("button", { name: "Size 4" })).toBeEnabled();
    // And the other way round: size 4 only comes in Jumbo.
    fireEvent.click(group("Size").getByRole("button", { name: "Size 4" }));
    expect(group("Type").getByRole("button", { name: "Small" })).toBeDisabled();
    expect(group("Type").getByRole("button", { name: "Jumbo" })).toBeEnabled();
  });

  it("cannot be saved while nothing has changed", async () => {
    show();
    await openSize();
    await screen.findByRole("group", { name: "Size" });
    expect(save()).toBeDisabled();
  });

  it("picking another size saves that variant", async () => {
    const { onVariant } = show();
    await openSize();
    fireEvent.click(await screen.findByRole("button", { name: "Size 4" }));
    expect(pressed("Size")).toEqual(["Size 4"]);
    expect(save()).toBeEnabled();
    fireEvent.click(save());
    await waitFor(() => expect(onVariant).toHaveBeenCalledWith("jumbo-4"));
  });

  it("picking another type, then a size it comes in, saves that variant", async () => {
    const { onVariant } = show({ variantId: "small-2", variantLabel: "Small · Size 2" });
    await openSize();
    await screen.findByRole("group", { name: "Type" });
    expect(pressed("Type")).toEqual(["Small"]);
    fireEvent.click(group("Size").getByRole("button", { name: "Size 3" }));
    fireEvent.click(group("Type").getByRole("button", { name: "Jumbo" }));
    fireEvent.click(save());
    await waitFor(() => expect(onVariant).toHaveBeenCalledWith("jumbo-3"));
  });

  it("a combination that does not exist cannot be saved", async () => {
    show({ variantId: "small-2", variantLabel: "Small · Size 2" });
    await openSize();
    await screen.findByRole("group", { name: "Type" });
    // Jumbo is disabled while Size 2 is picked; the pill does nothing.
    fireEvent.click(group("Type").getByRole("button", { name: "Jumbo" }));
    expect(pressed("Type")).toEqual(["Small"]);
    expect(save()).toBeDisabled();
  });

  it("a product with one thing that varies shows one group", async () => {
    getProduct.mockResolvedValue(
      diapers(
        ["10 sheets", "80 sheets"].map((size, n) => ({ ...variant(`w${n}`, "single", size), attributes: [{ attributeName: "Size", attributeSlug: "size", value: size, displayValue: size, sortOrder: 0 }] })),
        { Size: ["10 sheets", "80 sheets"] },
      ),
    );
    show({ variantId: "w1", variantLabel: "80 sheets" });
    await openSize();
    await screen.findByRole("group", { name: "Size" });
    expect(screen.queryByRole("group", { name: "Type" })).toBeNull();
    expect(screen.getByText("Pick the size. This changes your next order and the ones after it.")).toBeInTheDocument();
    expect(pressed("Size")).toEqual(["80 sheets"]);
  });

  it("says so while it loads, and when there is nothing she can subscribe to", async () => {
    getProduct.mockReturnValue(new Promise(() => undefined));
    show();
    await openSize();
    expect(screen.getByText("Loading sizes…")).toBeInTheDocument();
  });

  it("says so when no variant can be subscribed to", async () => {
    getProduct.mockResolvedValue(diapers([variant("x", "eco", "3", { isSubscribable: false })], { Type: ["eco"], Size: ["3"] }));
    show();
    await openSize();
    expect(await screen.findByText("There are no other sizes you can subscribe to.")).toBeInTheDocument();
  });

  it("its Save button is the same as every other Save: centred, in the Nesta Hub brown, with no arrow", async () => {
    show();
    await openSize();
    await screen.findByRole("group", { name: "Size" });
    expect(save()).toHaveClass("justify-center", "bg-shop-cta");
    expect(save()).not.toHaveClass("bg-shop-ink");
    expect(save().querySelector("svg")).toBeNull();
  });
});
