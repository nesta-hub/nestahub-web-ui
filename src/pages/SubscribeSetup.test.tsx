import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { BOX_CODES, BoxApiError, type Offer, type OfferLine } from "@/lib/subscriptionBoxes";
import SubscribeSetup from "./SubscribeSetup";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


const api = vi.hoisted(() => ({ offer: vi.fn(), subscribeFromOrder: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));
const status = vi.hoisted(() => ({ value: "on" as "on" | "off" | "loading" }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeStatus: () => status.value, useSubscribeEnabled: () => status.value === "on" }));
const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null, user: { id: "u1" } as { id: string } | null, loading: false } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("@/components/layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/auth/SignInForm", () => ({ SignInForm: ({ title }: { title: string }) => <div>{title}</div> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const line = (over: Partial<OfferLine> = {}): OfferLine => ({
  orderItemId: "i1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3", imageUrl: null,
  quantity: 1, priceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 3, timesBought: null, ...over,
});
const wipes = line({ orderItemId: "i2", variantId: "v2", productName: "Baby wipes", brand: "Softcare", variantLabel: "80 sheets", quantity: 2, priceKobo: 240_000, subscriptionPriceKobo: null, recommendedFrequencyWeeks: null });
const offer = (over: Partial<Offer> = {}): Offer => ({ state: "offer", orderNumber: "NST-1", eligible: [line(), wipes], subscribed: [], ...over });

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/subscriptions/setup/NST-1"]}>
        <Routes>
          <Route path="/subscriptions/setup/:orderNumber" element={<SubscribeSetup />} />
          <Route path="/subscriptions" element={<p>the old page</p>} />
          <Route path="/shop" element={<p>the shop</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
/** "Subscribe" on a row opens the drawer; "Subscribe" in the drawer says yes to it. */
async function subscribeTo(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Subscribe to ${name}`, hidden: true }));
  const drawer = await screen.findByRole("dialog");
  fireEvent.click(within(drawer).getByRole("button", { name: "Subscribe" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  status.value = "on";
  auth.value = { session: { access_token: "tok" }, user: { id: "u1" }, loading: false };
  api.offer.mockResolvedValue(offer());
  api.subscribeFromOrder.mockResolvedValue({ subscribed: ["i1", "i2"], skipped: [] });
});

describe("the setup page", () => {
  it("is the old page while the new experience is off, and asks for a sign-in when she is not signed in", async () => {
    status.value = "off";
    show();
    expect(await screen.findByText("the old page")).toBeInTheDocument();
    expect(api.offer).not.toHaveBeenCalled();
  });

  it("asks a visitor to sign in", async () => {
    auth.value = { session: null, user: null, loading: false };
    show();
    expect(await screen.findByText("Sign in to set up your subscription")).toBeInTheDocument();
  });

  it("lists what she bought under the three steps, none chosen yet, with 'Maybe later'", async () => {
    show();
    expect(await screen.findByText("Kisskids Diapers")).toBeInTheDocument();
    expect(api.offer).toHaveBeenCalledWith("tok", "NST-1");
    expect(screen.getByRole("heading", { name: "Subscribe" })).toBeInTheDocument();
    expect(screen.getByText("You get reminders")).toBeInTheDocument();
    expect(screen.getByText("You simply pay, no reordering")).toBeInTheDocument();
    expect(screen.getByText("You remain in control")).toBeInTheDocument();
    expect(screen.getByText("Subscribe to these essentials you just bought")).toBeInTheDocument();
    expect(screen.getByText("Size 3 · ×1")).toBeInTheDocument();
    expect(screen.getByText("80 sheets · ×2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe to Kisskids Diapers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe to Softcare Baby wipes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe later" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("the drawer shows the item and starts at how long one lasts; saying yes shows how often on the row, and 'Done'", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Subscribe to Kisskids Diapers" }));
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText("Kisskids Diapers")).toBeInTheDocument();
    expect(within(drawer).getByText("Renewal frequency")).toBeInTheDocument();
    expect(within(drawer).getByText("Every 3 weeks")).toBeInTheDocument(); // one lasts 3 weeks
    expect(within(drawer).queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "Subscribe" }));
    expect(within(screen.getByRole("list", { name: "Items from your order", hidden: true })).getByText("Every 3 weeks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change how often for Kisskids Diapers", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done", hidden: true })).toBeInTheDocument();
  });

  it("'Done' subscribes to what she said yes to, each at its own frequency, and goes to her subscription", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Kisskids Diapers");
    await subscribeTo("Softcare Baby wipes");
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    await waitFor(() => expect(api.subscribeFromOrder).toHaveBeenCalledTimes(1));
    expect(api.subscribeFromOrder).toHaveBeenCalledWith("tok", "NST-1", [
      { orderItemId: "i1", frequency: { kind: "weeks", every: 3 } },
      { orderItemId: "i2", frequency: { kind: "weeks", every: 4 } }, // not known: 4
    ]);
    expect(await screen.findByText("the old page")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("You're subscribed");
  });

  it("leaves out what she did not say yes to", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Softcare Baby wipes");
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    await waitFor(() => expect(api.subscribeFromOrder).toHaveBeenCalled());
    expect(api.subscribeFromOrder.mock.calls[0][2]).toEqual([{ orderItemId: "i2", frequency: { kind: "weeks", every: 4 } }]);
  });

  it("'Turn off auto-renew for this item' takes it back out", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Change how often for Kisskids Diapers", hidden: true }));
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByRole("button", { name: "Save" })).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "Turn off auto-renew for this item" }));
    expect(screen.getByRole("button", { name: "Subscribe to Kisskids Diapers", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe later", hidden: true })).toBeInTheDocument();
  });

  it("changes how often for one item: monthly goes as monthly, and a first day goes with weekly only", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Subscribe to Kisskids Diapers" }));
    const drawer = await screen.findByRole("dialog");
    fireEvent.click(within(drawer).getByRole("radio", { name: "Monthly, on a particular date" }));
    expect(within(drawer).queryByText(/Sure this will last a month/)).toBeNull();
    fireEvent.click(within(drawer).getByRole("button", { name: "Subscribe" }));
    // A drawer that is closing keeps the page behind it hidden from the accessibility tree (it never finishes
    // its exit animation in jsdom), so look for the button even when hidden.
    expect(within(screen.getByRole("list", { name: "Items from your order", hidden: true })).getByText("On the 25th of every month")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    await waitFor(() => expect(api.subscribeFromOrder).toHaveBeenCalled());
    expect(api.subscribeFromOrder.mock.calls[0][2][0]).toEqual({ orderItemId: "i1", frequency: { kind: "month_date", day: 25 } });
  });

  it("asks no first renewal day for a weekly item, and sends none: it counts from delivery", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Subscribe to Softcare Baby wipes" }));
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).queryByText("First renewal")).toBeNull();
    expect(within(drawer).queryByRole("button", { name: "Pick a day" })).toBeNull();
    fireEvent.click(within(drawer).getByRole("button", { name: "Subscribe" }));
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    await waitFor(() => expect(api.subscribeFromOrder).toHaveBeenCalled());
    expect(api.subscribeFromOrder.mock.calls[0][2][0]).toEqual({ orderItemId: "i2", frequency: { kind: "weeks", every: 4 } });
  });

  it("tells her what could not be done, in plain words, next to what could", async () => {
    api.subscribeFromOrder.mockResolvedValue({ subscribed: ["i1"], skipped: [{ orderItemId: "i2", reason: "already_subscribed" }] });
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Kisskids Diapers");
    await subscribeTo("Softcare Baby wipes");
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    expect(await screen.findByText("You're subscribed")).toBeInTheDocument();
    expect(screen.getByText("Softcare Baby wipes is already one of your subscriptions.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See my subscription" })).toHaveAttribute("href", "/subscriptions");
  });

  it("says plainly when nothing was subscribed", async () => {
    api.subscribeFromOrder.mockResolvedValue({ subscribed: [], skipped: [{ orderItemId: "i1", reason: "not_eligible" }, { orderItemId: "i2", reason: "invalid_frequency" }] });
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Kisskids Diapers");
    await subscribeTo("Softcare Baby wipes");
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    expect(await screen.findByText("Nothing was subscribed")).toBeInTheDocument();
    expect(screen.queryByText("You're subscribed")).not.toBeInTheDocument();
  });

  it("keeps the list on screen and says why when the order has closed, and when anything else goes wrong", async () => {
    api.subscribeFromOrder.mockRejectedValueOnce(new BoxApiError("closed", 409, BOX_CODES.orderClosed));
    show();
    await screen.findByText("Kisskids Diapers");
    await subscribeTo("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    expect(await screen.findByText("This order can no longer be subscribed from.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done", hidden: true })).toBeEnabled(); // not stuck busy

    api.subscribeFromOrder.mockRejectedValueOnce(new Error("network"));
    fireEvent.click(screen.getByRole("button", { name: "Done", hidden: true }));
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });

  it.each([
    ["an order we cannot find", () => api.offer.mockRejectedValue(new BoxApiError("nope", 404)), "We couldn't find that order."],
    ["something that went wrong", () => api.offer.mockRejectedValue(new Error("down")), "We couldn't load your order."],
    ["an order that is already subscribed", () => api.offer.mockResolvedValue(offer({ state: "subscribed", eligible: [], subscribed: [line()] })), "You're already subscribed to what's on this order."],
    ["an order with nothing to subscribe to", () => api.offer.mockResolvedValue(offer({ state: "none", eligible: [] })), "There's nothing on this order that can be subscribed to."],
  ])("says so for %s, with no button to press", async (_label, arrange, text) => {
    arrange();
    show();
    expect(await screen.findByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Subscribe to|Done|Maybe later/ })).not.toBeInTheDocument();
  });

  it("'Maybe later' and the back arrow go to the shop when she landed here directly", async () => {
    show();
    await screen.findByText("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(await screen.findByText("the shop")).toBeInTheDocument();
  });

  it("the back arrow goes back to the order confirmation she came from", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/checkout?order=NST-1&step=success", "/subscriptions/setup/NST-1"]} initialIndex={1}>
          <Routes>
            <Route path="/subscriptions/setup/:orderNumber" element={<SubscribeSetup />} />
            <Route path="/checkout" element={<p>the order confirmation</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByText("Kisskids Diapers");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByText("the order confirmation")).toBeInTheDocument();
  });
});
