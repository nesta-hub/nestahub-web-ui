import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail, ProductVariant } from "@/lib/api";
import { addDaysYmd, lagosToday } from "@/lib/lagosDay";
import { BOX_CODES, BoxApiError, type Catalog, type CatalogItem } from "@/lib/subscriptionBoxes";
import SubscribeToMore from "./SubscribeToMore";

// ---- what the page talks to -----------------------------------------------------------------
const api = vi.hoisted(() => ({ catalog: vi.fn(), enrol: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));

const auth = vi.hoisted(() => ({ value: { user: { id: "u1" } as unknown, session: { access_token: "tok" } as unknown, loading: false } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

const status = vi.hoisted(() => ({ value: "on" as "loading" | "on" | "off" }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeStatus: () => status.value, useSubscribeEnabled: () => status.value === "on" }));

// A product's details, by slug. One that is missing did not load.
const details = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/hooks/useCatalogue", () => ({ useProductDetail: (key: string) => ({ data: details.value[key], isLoading: false }) }));

vi.mock("@/lib/shareProduct", () => ({ shareProduct: vi.fn() }));

// The page around it brings its own header, nav and providers: it is stood in for.
vi.mock("@/components/layout", () => ({ Layout: ({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) => <div data-nav={String(showNav)}>{children}</div> }));
vi.mock("@/components/auth/SignInForm", () => ({ SignInForm: ({ title }: { title: string }) => <p>sign in: {title}</p> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { toast } from "sonner";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


// ---- fixtures -------------------------------------------------------------------------------
const item = (over: Partial<CatalogItem> = {}): CatalogItem => ({
  variantId: "v1", productId: "p1", productName: "Kisskids Diapers", brand: "Kisskids", slug: "kisskids-diapers", variantLabel: "Size 3", imageUrl: null,
  categoryId: "c1", priceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 4, subscribed: false, ...over,
});

const diapers = item();
const diapers4 = item({ variantId: "v4", variantLabel: "Size 4", priceKobo: 520_000, subscriptionPriceKobo: 470_000, recommendedFrequencyWeeks: 3 });
const wipes = item({ variantId: "v2", productId: "p2", productName: "Baby wipes", brand: "Softcare", slug: "baby-wipes", variantLabel: "80 sheets", categoryId: "c2", priceKobo: 240_000, subscriptionPriceKobo: null, recommendedFrequencyWeeks: null });
const formula = item({ variantId: "v3", productId: "p3", productName: "Infant formula", brand: "Nutrilac", slug: "infant-formula", variantLabel: "400g tin", categoryId: "c2", priceKobo: 1_200_000, subscriptionPriceKobo: 1_300_000, recommendedFrequencyWeeks: 2, subscribed: true });

const categories = [
  { id: "c1", name: "Diapers" },
  { id: "c2", name: "Feeding" },
];
const everything: Catalog = { categories, items: [diapers, diapers4, wipes, formula] };

const sizeVariant = (id: string, size: string, over: Partial<ProductVariant> = {}): ProductVariant => ({
  id, sku: id, price: 500_000, stock: 5, isInStock: true, isSubscribable: true, isActive: true,
  attributes: [{ attributeName: "Size", attributeSlug: "size", value: size, displayValue: `Size ${size}`, sortOrder: 0 }],
  ...over,
} as ProductVariant);

const LONG = "Soft, breathable diapers with a snug stretch waistband, made to keep your baby dry and comfortable day and night.";
/** The diapers' details: sizes 3 and 4 are in her list; size 5 cannot be subscribed to. */
const diapersDetail = {
  id: "p1", name: "Kisskids Diapers", brand: "Kisskids", slug: "kisskids-diapers", description: LONG, categoryId: "c1", minPrice: 1,
  variants: [sizeVariant("v1", "3"), sizeVariant("v4", "4", { price: 520_000 }), sizeVariant("v5", "5", { isSubscribable: false })],
  availableAttributes: { Size: ["3", "4", "5"] },
} as unknown as ProductDetail;

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.search}</output>;
}

/** The page, at its own address, with the Subscription page next to it to land on. */
function show(at = "/subscriptions/add") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[at]}>
        <Routes>
          <Route path="/subscriptions/add" element={<SubscribeToMore />} />
          <Route path="/subscriptions" element={<p>the Subscription page</p>} />
        </Routes>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { invalidate };
}

const tile = (name: string | RegExp) => screen.getByRole("link", { name, hidden: true }).closest("li") ?? screen.getByRole("button", { name, hidden: true }).closest("li");
const tileOf = (name: RegExp) => (screen.queryByRole("link", { name, hidden: true }) ?? screen.getByRole("button", { name, hidden: true })).closest("li") as HTMLElement;
const row = (category: string) => within(screen.getByRole("list", { name: category }));
const where = () => screen.getByTestId("where").textContent;

/** The product page that is open, or null. */
const productPage = () => screen.queryByRole("dialog", { hidden: true });

/** Open a product's page from the list. */
async function openProduct(name: RegExp = /Kisskids Diapers/) {
  fireEvent.click(await screen.findByRole("button", { name }));
  return within(await screen.findByRole("dialog", { hidden: true }));
}

const mainButton = (page: ReturnType<typeof within>) => page.getByRole("button", { name: /^(Subscribe|Add to cart|One moment…)/, hidden: true });
const quantity = (page: ReturnType<typeof within>) => page.getByRole("button", { name: "Fewer", hidden: true }).nextElementSibling?.textContent;

/** What the page sent to `enrol`, exactly (an extra key that is undefined would show up here). */
const enrolBody = () => {
  expect(api.enrol).toHaveBeenCalledTimes(1);
  expect(api.enrol.mock.calls[0][0]).toBe("tok");
  return api.enrol.mock.calls[0][1];
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.value = { user: { id: "u1" }, session: { access_token: "tok" }, loading: false };
  status.value = "on";
  details.value = { "kisskids-diapers": diapersDetail };
  api.catalog.mockImplementation(async (_token: string, categoryId?: string) => (categoryId ? { categories, items: everything.items.filter((i) => i.categoryId === categoryId) } : everything));
  api.enrol.mockResolvedValue({ subscriptionId: "s9" });
});

describe("who gets the page", () => {
  it("sends her to the old Subscription page while the new experience is off", async () => {
    status.value = "off";
    show();
    expect(await screen.findByText("the Subscription page")).toBeInTheDocument();
    expect(api.catalog).not.toHaveBeenCalled();
  });

  it("shows only a loading message while it is still finding out", () => {
    status.value = "loading";
    show();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("the Subscription page")).toBeNull();
    expect(api.catalog).not.toHaveBeenCalled();
  });

  it("asks someone who is not signed in to sign in, and shows her no list", () => {
    auth.value = { user: null, session: null, loading: false };
    show();
    expect(screen.getByText(/sign in:/)).toBeInTheDocument();
    expect(api.catalog).not.toHaveBeenCalled();
  });

  it("has a title, a line about what is listed, and a way back to the Subscription page", async () => {
    show();
    expect(await screen.findByRole("heading", { level: 1, name: "Subscription" })).toBeInTheDocument();
    expect(screen.getByText("Only items that can be subscribed to are listed here.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/subscriptions");
  });
});

describe("the list", () => {
  it("has a row for each category, in the categories' order, with a tile for each product, named as the shop names it (brand, then name)", async () => {
    show();
    await screen.findByText("Nutrilac Infant formula");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Diapers", "Feeding"]);
    expect(row("Diapers").getAllByRole("listitem")).toHaveLength(1);
    expect(row("Feeding").getAllByRole("listitem").map((li) => li.querySelector("span.truncate")?.textContent)).toEqual(["Softcare Baby wipes", "Nutrilac Infant formula"]);
  });

  it("shows one tile for a product with several sizes, at the least she would pay, from its subscription price", async () => {
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    const diapersTile = within(tileOf(/Kisskids Diapers/));
    expect(diapersTile.getByText("from ₦4,500")).toBeInTheDocument();
    expect(tileOf(/Kisskids Diapers/).querySelector("s")).toBeNull();
  });

  it("shows just the price for a product with one size, and the regular price when there is no subscription price", async () => {
    show();
    await screen.findByText("Softcare Baby wipes");
    expect(within(tileOf(/Baby wipes/)).getByText("₦2,400")).toBeInTheDocument();
    // The formula's subscription price is not lower, so it is the regular one.
    expect(within(tileOf(/Infant formula/)).getByText("₦12,000")).toBeInTheDocument();
    expect(screen.queryByText("₦13,000")).toBeNull();
  });

  it("shows the product's picture, or a stand-in when there is none", async () => {
    api.catalog.mockResolvedValue({ categories, items: [item({ imageUrl: "https://img.test/d.jpg" }), wipes] });
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    expect(tileOf(/Kisskids Diapers/).querySelector("img")).toHaveAttribute("src", "https://img.test/d.jpg");
    expect(tileOf(/Baby wipes/).querySelector("img")).toBeNull();
    expect(tileOf(/Baby wipes/).querySelector("svg")).not.toBeNull();
  });

  it("puts anything whose category it was not told about in a last row, Other", async () => {
    api.catalog.mockResolvedValue({ categories, items: [diapers, item({ variantId: "v9", productId: "p9", productName: "Mystery", categoryId: null })] });
    show();
    await screen.findByText("Kisskids Mystery");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Diapers", "Other"]);
  });

  it("says there is nothing to show when the list is empty", async () => {
    api.catalog.mockResolvedValue({ categories, items: [] });
    show();
    expect(await screen.findByText("Nothing to show")).toBeInTheDocument();
  });

  it("offers to try again when it cannot load, and shows the list once it can", async () => {
    api.catalog.mockRejectedValueOnce(new BoxApiError("down", 500));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Kisskids Kisskids Diapers")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});

describe("what she already subscribes to", () => {
  it("is tagged, and its tile takes her to her subscription instead of opening its page", async () => {
    show();
    await screen.findByText("Nutrilac Infant formula");
    expect(within(tileOf(/Infant formula/)).getByText("Subscribed")).toBeInTheDocument();
    expect(within(tileOf(/Kisskids Diapers/)).queryByText("Subscribed")).toBeNull();

    const link = screen.getByRole("link", { name: /Infant formula/ });
    expect(link).toHaveAttribute("href", "/subscriptions");
    fireEvent.click(link);
    expect(await screen.findByText("the Subscription page")).toBeInTheDocument();
    expect(api.enrol).not.toHaveBeenCalled();
  });

  it("tags a product when she has any one of its sizes", async () => {
    api.catalog.mockResolvedValue({ categories, items: [diapers, { ...diapers4, subscribed: true }] });
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    expect(within(tileOf(/Kisskids Diapers/)).getByText("Subscribed")).toBeInTheDocument();
    expect(tile(/Kisskids Diapers/)).not.toBeNull();
  });
});

describe("finding something", () => {
  it("shows one category when she taps its pill, asking the server for it, and everything again on All", async () => {
    show();
    await screen.findByText("Nutrilac Infant formula");
    expect(api.catalog).toHaveBeenLastCalledWith("tok", undefined);

    fireEvent.click(screen.getByRole("button", { name: "Feeding" }));
    expect(api.catalog).toHaveBeenLastCalledWith("tok", "c2");
    await waitFor(() => expect(screen.queryByText("Kisskids Kisskids Diapers")).toBeNull());
    expect(screen.getByText("Softcare Baby wipes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feeding" })).toHaveAttribute("aria-pressed", "true");
    // The other pills are still there to change her mind with.
    expect(screen.getByRole("button", { name: "Diapers" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(await screen.findByText("Kisskids Kisskids Diapers")).toBeInTheDocument();
    expect(api.catalog).toHaveBeenLastCalledWith("tok", undefined);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the pills when a category does not load, so she can go back", async () => {
    show();
    await screen.findByText("Nutrilac Infant formula");
    api.catalog.mockRejectedValueOnce(new BoxApiError("down", 500));
    fireEvent.click(screen.getByRole("button", { name: "Feeding" }));
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(await screen.findByText("Kisskids Kisskids Diapers")).toBeInTheDocument();
  });

  it("starts on All", async () => {
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["name", "baby wipes", "Softcare Baby wipes"],
    ["brand", "NUTRILAC", "Nutrilac Infant formula"],
    ["size", "80 SHEETS", "Softcare Baby wipes"],
    ["name, brand and size together", "kisskids size 4", "Kisskids Kisskids Diapers"],
  ])("finds a product by its %s, in any case", async (_what, typed, found) => {
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search subscribable items" }), { target: { value: typed } });
    expect(screen.getByText(found)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("says there is nothing to show when nothing matches, and brings the list back when she clears it", async () => {
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    const box = screen.getByRole("searchbox", { name: "Search subscribable items" });
    fireEvent.change(box, { target: { value: "zzz" } });
    expect(screen.getByText("Nothing to show")).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("does not ask the server again for a search", async () => {
    show();
    await screen.findByText("Kisskids Kisskids Diapers");
    const calls = api.catalog.mock.calls.length;
    fireEvent.change(screen.getByRole("searchbox", { name: "Search subscribable items" }), { target: { value: "wipes" } });
    expect(api.catalog.mock.calls.length).toBe(calls);
  });
});

describe("the product page", () => {
  it("opens as a full page for the product she taps, ready to subscribe: no switch, no one-time purchase", async () => {
    show();
    const page = await openProduct();
    expect(page.getByRole("heading", { level: 1, name: "Kisskids Diapers" })).toBeInTheDocument();
    expect(page.getByText("Size 3", { selector: "p" })).toBeInTheDocument();
    expect(page.queryByRole("switch", { hidden: true })).toBeNull();
    expect(page.queryByRole("button", { name: /Add to cart/, hidden: true })).toBeNull();
    expect(page.getByRole("radiogroup", { name: "Renewal frequency", hidden: true })).toBeInTheDocument();
    expect(quantity(page)).toBe("1");
    expect(where()).toBe("/subscriptions/add?product=p1");
  });

  it("shows the subscription price at the top and on the button, and no 'and pay' beside Subscribe", async () => {
    show();
    const page = await openProduct();
    expect(page.getByText("₦4,500", { selector: "p" })).toBeInTheDocument();
    expect(page.queryByText("₦5,000")).toBeNull();
    expect(page.queryByText(/and pay/)).toBeNull();
    expect(mainButton(page)).toHaveTextContent(/^Subscribe₦4,500$/);

    fireEvent.click(page.getByRole("button", { name: "More", hidden: true }));
    expect(page.getByText("₦9,000", { selector: "p" })).toBeInTheDocument();
    expect(mainButton(page)).toHaveTextContent(/₦9,000$/);
  });

  it("offers only the sizes in her list, starting on the first", async () => {
    show();
    const page = await openProduct();
    const sizes = within(page.getByRole("group", { name: "Size", hidden: true }));
    expect(sizes.getAllByRole("button", { hidden: true }).map((b) => b.textContent)).toEqual(["Size 3", "Size 4"]);
    expect(sizes.getByRole("button", { name: "Size 3", hidden: true })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(sizes.getByRole("button", { name: "Size 4", hidden: true }));
    expect(page.getByText("₦4,700", { selector: "p" })).toBeInTheDocument();
    // Size 4 lasts 3 weeks, and she had not chosen how often yet.
    expect(page.getByText("Every 3 weeks")).toBeInTheDocument();
  });

  it("starts on a size she does not already subscribe to", async () => {
    api.catalog.mockResolvedValue({ categories, items: [{ ...diapers, subscribed: true }, diapers4] });
    show("/subscriptions/add?product=p1");
    const page = within(await screen.findByRole("dialog", { hidden: true }));
    expect(page.getByRole("button", { name: "Size 4", hidden: true })).toHaveAttribute("aria-pressed", "true");
    expect(mainButton(page)).toBeEnabled();
  });

  it("picks from the list's own sizes when the product's details do not load", async () => {
    details.value = {};
    show();
    const page = await openProduct();
    const sizes = within(page.getByRole("group", { name: "Size", hidden: true }));
    expect(sizes.getAllByRole("button", { hidden: true }).map((b) => b.textContent)).toEqual(["Size 3", "Size 4"]);
    fireEvent.click(sizes.getByRole("button", { name: "Size 4", hidden: true }));
    fireEvent.click(mainButton(page));
    await waitFor(() => expect(api.enrol).toHaveBeenCalled());
    expect(enrolBody()).toStrictEqual({ variantId: "v4", quantity: 1, frequency: { kind: "weeks", every: 3 } });
  });

  it("starts at how long the pack lasts when we know, and at every 4 weeks when we do not", async () => {
    show();
    let page = await openProduct();
    expect(page.getByText("Every 4 weeks")).toBeInTheDocument();
    fireEvent.click(page.getByRole("button", { name: "Back", hidden: true }));
    await waitFor(() => expect(productPage()).toBeNull());

    page = await openProduct(/Baby wipes/);
    expect(page.getByText("Every 4 weeks")).toBeInTheDocument();
  });

  it("goes back to the list with Back, and starts fresh the next time", async () => {
    show();
    let page = await openProduct();
    fireEvent.click(page.getByRole("button", { name: "More", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "More weeks", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "Back", hidden: true }));
    await waitFor(() => expect(productPage()).toBeNull());
    expect(where()).toBe("/subscriptions/add");
    expect(api.enrol).not.toHaveBeenCalled();

    page = await openProduct();
    expect(quantity(page)).toBe("1");
    expect(page.getByText("Every 4 weeks")).toBeInTheDocument();
  });

  it("closes with Back when she came straight to it", async () => {
    show("/subscriptions/add?product=p1");
    const page = within(await screen.findByRole("dialog", { hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "Back", hidden: true }));
    await waitFor(() => expect(productPage()).toBeNull());
    expect(where()).toBe("/subscriptions/add");
    expect(screen.getByText("Kisskids Kisskids Diapers")).toBeInTheDocument();
  });

  it("counts from 1 to 99", async () => {
    show();
    const page = await openProduct();
    expect(page.getByRole("button", { name: "Fewer", hidden: true })).toBeDisabled();
    for (let n = 1; n < 99; n++) fireEvent.click(page.getByRole("button", { name: "More", hidden: true }));
    expect(quantity(page)).toBe("99");
    expect(page.getByRole("button", { name: "More", hidden: true })).toBeDisabled();
    fireEvent.click(page.getByRole("button", { name: "Fewer", hidden: true }));
    expect(quantity(page)).toBe("98");
  }, 15_000); // 98 taps: slow when the whole suite runs at once

  it("folds a long description to two lines, with more", async () => {
    show();
    const page = await openProduct();
    fireEvent.click(page.getByRole("button", { name: "Read the full description", hidden: true }));
    expect(page.getByRole("button", { name: "less", hidden: true })).toBeInTheDocument();
  });

  it("explains how Subscribe works in a drawer with no close button", async () => {
    show();
    const page = await openProduct();
    fireEvent.click(page.getByRole("button", { name: "Learn more", hidden: true }));
    const drawer = within(await screen.findByRole("dialog", { name: "How Subscribe works" }));
    expect(drawer.getByText("We remind you")).toBeInTheDocument();
    expect(drawer.queryByRole("button", { name: /close/i })).toBeNull();
    fireEvent.click(drawer.getByRole("button", { name: "Got it" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "How Subscribe works" })?.getAttribute("data-state") ?? "closed").toBe("closed"));
  });

  it("asks for the day of her first order, not a first renewal, whatever the frequency", async () => {
    show();
    const page = await openProduct();
    expect(page.getByText("First order")).toBeInTheDocument();
    expect(page.queryByText("First renewal")).toBeNull();
    // Today is Wed 25 Nov: every 4 weeks puts the first order four weeks on, with a way to change it.
    expect(page.getByText("Wed 23 Dec")).toBeInTheDocument();
    expect(page.queryByRole("button", { name: "Pick a day", hidden: true })).toBeNull();
    // Monthly on the 25th (today's date): the next 25th at least a week away.
    fireEvent.click(page.getByRole("radio", { name: "Monthly, on a particular date", hidden: true }));
    expect(page.getByText("First order")).toBeInTheDocument();
    expect(page.getByText("Fri 25 Dec")).toBeInTheDocument();
    fireEvent.click(page.getByRole("button", { name: "Change date", hidden: true }));
    expect(page.getByLabelText("Day of the first order")).toHaveAttribute("min", lagosToday());
  });
});

describe("Subscribe", () => {
  it("sends weekly as she left it: the item, how many, how often, and no first day", async () => {
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));
    await waitFor(() => expect(api.enrol).toHaveBeenCalled());
    expect(enrolBody()).toStrictEqual({ variantId: "v1", quantity: 1, frequency: { kind: "weeks", every: 4 } });
  });

  it("sends weekly with the first day she picked, and the quantity she chose, keeping her how-often when the quantity changes", async () => {
    show();
    const page = await openProduct();
    fireEvent.click(page.getByRole("button", { name: "More weeks", hidden: true })); // every 5 weeks
    const day = addDaysYmd(lagosToday(), 10);
    fireEvent.click(page.getByRole("button", { name: "Change date", hidden: true }));
    fireEvent.change(page.getByLabelText("Day of the first order"), { target: { value: day } });
    fireEvent.click(page.getByRole("button", { name: "More", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "More", hidden: true }));
    expect(page.getByText("Every 5 weeks")).toBeInTheDocument();

    fireEvent.click(mainButton(page));
    await waitFor(() => expect(api.enrol).toHaveBeenCalled());
    expect(enrolBody()).toStrictEqual({ variantId: "v1", quantity: 3, frequency: { kind: "weeks", every: 5 }, firstDate: day });
  });

  it("sends monthly on a date with the first order day she picked, kept when she changes the frequency", async () => {
    show();
    const page = await openProduct();
    const day = lagosToday();
    fireEvent.click(page.getByRole("button", { name: "Change date", hidden: true }));
    fireEvent.change(page.getByLabelText("Day of the first order"), { target: { value: day } });
    fireEvent.click(page.getByRole("radio", { name: "Monthly, on a particular date", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "Later date", hidden: true })); // the 26th
    fireEvent.click(mainButton(page));
    await waitFor(() => expect(api.enrol).toHaveBeenCalled());
    expect(enrolBody()).toStrictEqual({ variantId: "v1", quantity: 1, frequency: { kind: "month_date", day: 26 }, firstDate: day });
  });

  it("sends monthly on a day of the month", async () => {
    show();
    const page = await openProduct(/Baby wipes/);
    fireEvent.click(page.getByRole("radio", { name: "Monthly, on a particular day", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "3rd", hidden: true }));
    fireEvent.click(page.getByRole("button", { name: "Fri", hidden: true }));
    fireEvent.click(mainButton(page));
    await waitFor(() => expect(api.enrol).toHaveBeenCalled());
    expect(enrolBody()).toStrictEqual({ variantId: "v2", quantity: 1, frequency: { kind: "month_weekday", nth: 3, weekday: 5 } });
  });

  it("tells the tab to read again, says she is subscribed, and goes to her subscription", async () => {
    const { invalidate } = show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));

    expect(await screen.findByText("the Subscription page")).toBeInTheDocument();
    expect(productPage()).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscription-tab"] });
    expect(toast.success).toHaveBeenCalledWith("You're subscribed to Kisskids Diapers");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("does not subscribe twice when the button is tapped again while it works", async () => {
    let finish: (value: unknown) => void = () => {};
    api.enrol.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));
    const working = mainButton(page);
    expect(working).toHaveTextContent(/^One moment…/);
    expect(working).toBeDisabled();
    fireEvent.click(working);
    expect(api.enrol).toHaveBeenCalledTimes(1);

    finish({ subscriptionId: "s9" });
    expect(await screen.findByText("the Subscription page")).toBeInTheDocument();
  });
});

describe("when subscribing does not work", () => {
  it("says she already subscribes, keeps the page open, and tags the tile", async () => {
    api.enrol.mockRejectedValue(new BoxApiError("Already subscribed", 409, BOX_CODES.alreadySubscribed));
    const { invalidate } = show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));

    expect(await page.findByRole("alert", { hidden: true })).toHaveTextContent("You already subscribe to this one.");
    expect(productPage()).not.toBeNull();
    expect(page.getByRole("link", { name: "See your subscription", hidden: true })).toHaveAttribute("href", "/subscriptions");
    // Nothing more to do here: the button is no longer offered as a way to do it again, and she stays on that size.
    expect(mainButton(page)).toBeDisabled();
    expect(page.getByRole("button", { name: "Size 3", hidden: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("the Subscription page")).toBeNull();
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["subscription-tab"] });
    expect(toast.success).not.toHaveBeenCalled();

    fireEvent.click(page.getByRole("button", { name: "Back", hidden: true }));
    await waitFor(() => expect(productPage()).toBeNull());
    expect(within(tileOf(/Kisskids Diapers/)).getByText("Subscribed")).toBeInTheDocument();
  });

  it("says the item cannot be subscribed to right now, keeps the page open, and lets her try again", async () => {
    api.enrol.mockRejectedValueOnce(new BoxApiError("Item not available", 409, BOX_CODES.itemNotAvailable));
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));

    expect(await page.findByRole("alert", { hidden: true })).toHaveTextContent("That item can't be subscribed to right now.");
    expect(productPage()).not.toBeNull();
    // Not stuck on "One moment…", and the tile is not tagged.
    expect(mainButton(page)).toBeEnabled();
    expect(within(tileOf(/Kisskids Diapers/)).queryByText("Subscribed")).toBeNull();

    fireEvent.click(mainButton(page));
    expect(await screen.findByText("the Subscription page")).toBeInTheDocument();
    expect(api.enrol).toHaveBeenCalledTimes(2);
  });

  it("shows the message the server gave for any other refusal", async () => {
    api.enrol.mockRejectedValue(new BoxApiError("Quantity is too high for this item", 400, "SOMETHING_ELSE"));
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));
    expect(await page.findByRole("alert", { hidden: true })).toHaveTextContent("Quantity is too high for this item");
    expect(mainButton(page)).toBeEnabled();
  });

  it("says something plain when it could not reach the server, and does not stay busy", async () => {
    api.enrol.mockRejectedValue(new TypeError("Failed to fetch"));
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));
    const alert = await page.findByRole("alert", { hidden: true });
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
    expect(alert.textContent).not.toMatch(/fetch/i);
    expect(mainButton(page)).toBeEnabled();
  });

  it("clears the message when she tries again", async () => {
    api.enrol.mockRejectedValueOnce(new BoxApiError("Item not available", 409, BOX_CODES.itemNotAvailable));
    let finish: (value: unknown) => void = () => {};
    api.enrol.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    show();
    const page = await openProduct();
    fireEvent.click(mainButton(page));
    await page.findByRole("alert", { hidden: true });
    fireEvent.click(mainButton(page));
    await waitFor(() => expect(page.queryByRole("alert", { hidden: true })).toBeNull());
    finish({ subscriptionId: "s9" });
    await screen.findByText("the Subscription page");
  });
});
