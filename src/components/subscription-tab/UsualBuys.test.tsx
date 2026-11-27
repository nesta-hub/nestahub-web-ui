import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX_CODES, BoxApiError, type Offer, type OfferLine } from "@/lib/subscriptionBoxes";
import { UsualBuys } from "./UsualBuys";
import { MAX_SHOWN, asCatalogItem, boughtLine } from "./usualBuysHelpers";

const api = vi.hoisted(() => ({ offer: vi.fn(), enrol: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));
const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { toast } from "sonner";

const line = (n: number, over: Partial<OfferLine> = {}): OfferLine => ({
  orderItemId: null, variantId: `v${n}`, productName: `Product ${n}`, brand: "Brand", variantLabel: `Size ${n}`, imageUrl: null,
  quantity: 2, priceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 3, timesBought: 3, ...over,
});
const offer = (lines: OfferLine[], state: Offer["state"] = "offer"): Offer => ({ state, orderNumber: null, eligible: lines, subscribed: [] });

let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UsualBuys />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.value = { session: { access_token: "tok" } };
  api.offer.mockResolvedValue(offer([line(1), line(2)]));
  api.enrol.mockResolvedValue({ subscriptionId: "s1" });
});

describe("what she buys often, on the empty tab", () => {
  it("lists what she has been buying, how often and how long it lasts, and asks without an order number", async () => {
    show();
    expect(await screen.findByText("Choose from what you buy the most")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    // bought 3 times; 3 weeks a pack x 2 packs = 6 weeks
    expect(screen.getAllByText("Bought 3 times · lasts about 6 weeks")).toHaveLength(2);
    expect(api.offer).toHaveBeenCalledWith("tok");
  });

  it(`shows at most ${MAX_SHOWN}`, async () => {
    api.offer.mockResolvedValue(offer(Array.from({ length: 8 }, (_, n) => line(n + 1))));
    show();
    await screen.findByText("Product 1");
    expect(screen.getAllByRole("button", { name: /^Subscribe to Product/ })).toHaveLength(MAX_SHOWN);
  });

  it("subscribes through the same sheet as 'Subscribe to something else': how often, then the item and its frequency go to enrol", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe to Product 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(api.enrol).toHaveBeenCalledTimes(1));
    // Starts at how long one lasts (3 weeks), for one.
    expect(api.enrol).toHaveBeenCalledWith("tok", { variantId: "v1", quantity: 1, frequency: { kind: "weeks", every: 3 } });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("You're subscribed to Product 1"));
  });

  it("reads the tab and the list again after subscribing, so it shows where she is now", async () => {
    show();
    const spy = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe to Product 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["subscription-tab"] }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ["subscribe-offer"] });
  });

  it("when subscribing fails, says why inside the sheet and does not claim it worked", async () => {
    api.enrol.mockRejectedValue(new BoxApiError("x", 409, BOX_CODES.alreadySubscribed));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe to Product 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You already subscribe to this one.");
    expect(toast.success).not.toHaveBeenCalled();
  });

  describe("shows nothing, and the invitation above it stands on its own", () => {
    it.each([
      ["she has bought nothing we can subscribe her to", () => api.offer.mockResolvedValue(offer([], "none"))],
      ["the offer is empty", () => api.offer.mockResolvedValue(offer([]))],
      ["something went wrong", () => api.offer.mockRejectedValue(new Error("down"))],
    ])("when %s", async (_label, arrange) => {
      arrange();
      const { container } = show();
      await waitFor(() => expect(api.offer).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 20));
      expect(container).toBeEmptyDOMElement();
    });

    it("when she is not signed in, and does not ask", async () => {
      auth.value = { session: null };
      const { container } = show();
      await new Promise((r) => setTimeout(r, 20));
      expect(container).toBeEmptyDOMElement();
      expect(api.offer).not.toHaveBeenCalled();
    });
  });
});

describe("asCatalogItem", () => {
  it("is the same thing, not yet subscribed, with no product page to link to", () => {
    expect(asCatalogItem(line(1))).toEqual({
      variantId: "v1", productId: "", productName: "Product 1", brand: "Brand", slug: null, variantLabel: "Size 1", imageUrl: null,
      categoryId: null, priceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 3, subscribed: false,
    });
  });
});

describe("boughtLine", () => {
  it("says how often, and how long it lasts", () => {
    expect(boughtLine({ timesBought: 3, recommendedFrequencyWeeks: 2, quantity: 1 })).toBe("Bought 3 times · lasts about 2 weeks");
    expect(boughtLine({ timesBought: 1, recommendedFrequencyWeeks: 3, quantity: 1 })).toBe("Bought once · lasts about 3 weeks");
    expect(boughtLine({ timesBought: 2, recommendedFrequencyWeeks: 1, quantity: 1 })).toBe("Bought 2 times · lasts about a week");
  });

  it("leaves out what we do not know", () => {
    expect(boughtLine({ timesBought: 2, recommendedFrequencyWeeks: null, quantity: 1 })).toBe("Bought 2 times");
    expect(boughtLine({ timesBought: null, recommendedFrequencyWeeks: 2, quantity: 2 })).toBe("lasts about 4 weeks");
    expect(boughtLine({ timesBought: null, recommendedFrequencyWeeks: null, quantity: 2 })).toBe("");
  });
});
