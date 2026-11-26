import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Offer, OfferLine } from "@/lib/subscriptionBoxes";
import { namesOf, savingOf } from "./offerText";
import { SubscribeOffer } from "./SubscribeOffer";

const api = vi.hoisted(() => ({ offer: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));
const flag = vi.hoisted(() => ({ on: true }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => flag.on }));
const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

const line = (over: Partial<OfferLine> = {}): OfferLine => ({
  orderItemId: "i1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3", imageUrl: null,
  quantity: 2, priceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 4, timesBought: null, ...over,
});
const offer = (over: Partial<Offer> = {}): Offer => ({ state: "offer", orderNumber: "NST-1", eligible: [line()], subscribed: [], ...over });

function show(orderNumber = "NST-1", embedded?: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubscribeOffer orderNumber={orderNumber} embedded={embedded} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  flag.on = true;
  auth.value = { session: { access_token: "tok" } };
  api.offer.mockResolvedValue(offer());
});

describe("SubscribeOffer", () => {
  it("offers to subscribe to what she bought, naming it, and links to the setup", async () => {
    show();
    expect(await screen.findByRole("heading", { name: "Never run out of your Kisskids Diapers" })).toBeInTheDocument();
    expect(screen.getByText("Subscribe to this item.")).toBeInTheDocument();
    expect(screen.getByText(/We remind you via WhatsApp notifications before you run out/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/subscriptions/setup/NST-1");
    expect(api.offer).toHaveBeenCalledWith("tok", "NST-1");
  });

  it("names two items, says 'these items', and shows a picture of each", async () => {
    api.offer.mockResolvedValue(offer({ eligible: [line({ imageUrl: "/a.jpg" }), line({ orderItemId: "i2", productName: "Baby wipes", imageUrl: "/b.jpg" })] }));
    const { container } = show();
    expect(await screen.findByRole("heading", { name: "Never run out of your Kisskids Diapers and Baby wipes" })).toBeInTheDocument();
    expect(screen.getByText("Subscribe to these items.")).toBeInTheDocument();
    expect([...container.querySelectorAll("img")].map((img) => img.getAttribute("src"))).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("does not talk about a saving", async () => {
    show();
    await screen.findByRole("link", { name: "Subscribe" });
    expect(screen.queryByText(/You save/)).not.toBeInTheDocument();
  });

  it("says she is subscribed when the order already carries a subscription (from the product page)", async () => {
    api.offer.mockResolvedValue(offer({ state: "subscribed", eligible: [], subscribed: [line()] }));
    show();
    expect(await screen.findByRole("heading", { name: "You are subscribed" })).toBeInTheDocument();
    expect(screen.getByText("You will not have to worry about forgetting.")).toBeInTheDocument();
    expect(screen.getByText(/before it finishes/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View my subscriptions" })).toHaveAttribute("href", "/subscriptions");
    expect(screen.queryByRole("link", { name: "Subscribe" })).not.toBeInTheDocument();
  });

  it("on its own it is a bordered card; inside the order-placed card it has no border of its own", async () => {
    const { unmount } = show();
    expect(await screen.findByRole("region", { name: "Subscribe to what you just bought" })).toHaveClass("border");
    unmount();
    show("NST-1", true);
    expect(await screen.findByRole("region", { name: "Subscribe to what you just bought" })).not.toHaveClass("border");
  });

  it("encodes the order number in the link", async () => {
    show("NST/2 3");
    expect(await screen.findByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/subscriptions/setup/NST%2F2%203");
  });

  describe("shows nothing, and never gets in the way of the order confirmation", () => {
    it("when the new experience is off, and does not even ask", async () => {
      flag.on = false;
      const { container } = show();
      await new Promise((r) => setTimeout(r, 20));
      expect(container).toBeEmptyDOMElement();
      expect(api.offer).not.toHaveBeenCalled();
    });

    it("when she is not signed in, and does not ask", async () => {
      auth.value = { session: null };
      const { container } = show();
      await new Promise((r) => setTimeout(r, 20));
      expect(container).toBeEmptyDOMElement();
      expect(api.offer).not.toHaveBeenCalled();
    });

    it("when there is nothing to offer", async () => {
      api.offer.mockResolvedValue(offer({ state: "none", eligible: [] }));
      const { container } = show();
      await waitFor(() => expect(api.offer).toHaveBeenCalled());
      expect(container).toBeEmptyDOMElement();
    });

    it("when an offer has nothing in it", async () => {
      api.offer.mockResolvedValue(offer({ eligible: [] }));
      const { container } = show();
      await waitFor(() => expect(api.offer).toHaveBeenCalled());
      expect(container).toBeEmptyDOMElement();
    });

    it("when the call fails", async () => {
      api.offer.mockRejectedValue(new Error("down"));
      const { container } = show();
      await waitFor(() => expect(api.offer).toHaveBeenCalled());
      expect(container).toBeEmptyDOMElement();
    });
  });
});

describe("namesOf", () => {
  const named = (...names: string[]) => names.map((productName) => ({ productName }));
  it("reads as a short sentence", () => {
    expect(namesOf(named("A"))).toBe("A");
    expect(namesOf(named("A", "B"))).toBe("A and B");
    expect(namesOf(named("A", "B", "C"))).toBe("A, B and 1 more");
    expect(namesOf(named("A", "B", "C", "D"))).toBe("A, B and 2 more");
    expect(namesOf(named("A", "B", "C"), 3)).toBe("A, B, C");
  });
  it("does not repeat a product bought in two sizes", () => {
    expect(namesOf(named("A", "A", "B"))).toBe("A and B");
  });
});

describe("savingOf", () => {
  it("adds up the saving across the quantity, and ignores lines with none", () => {
    expect(savingOf([line(), line({ quantity: 1, priceKobo: 100_000, subscriptionPriceKobo: 90_000 }), line({ subscriptionPriceKobo: null }), line({ subscriptionPriceKobo: 500_000 })])).toBe(100_000 + 10_000);
  });
});
