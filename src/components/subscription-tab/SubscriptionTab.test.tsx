import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX_CODES, BoxApiError, type Box, type MyBoxes, type SubscribedItem } from "@/lib/subscriptionBoxes";
import { SubscriptionTab } from "./SubscriptionTab";

// ---- what the tab talks to ------------------------------------------------------------------
const api = vi.hoisted(() => ({
  mine: vi.fn(),
  offer: vi.fn(),
  enrol: vi.fn(),
  deliveryOptions: vi.fn(),
  pay: vi.fn(),
  skip: vi.fn(),
  undoSkip: vi.fn(),
  leaveOut: vi.fn(),
  moveDay: vi.fn(),
  changeLocation: vi.fn(),
  setQuantity: vi.fn(),
  setVariant: vi.fn(),
  setFrequency: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));

// The cache of "is it on for her", which the tab clears when the server says the feature has gone.
const resetSubscribeEnabled = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useSubscribeEnabled", () => ({ resetSubscribeEnabled }));

const storeClaimToken = vi.fn();
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  storeClaimToken: (...args: unknown[]) => storeClaimToken(...args),
  getPickupStations: async () => [
    { id: "st-1", name: "Yaba station", address: "1 Yaba Rd", dayOfWeek: "Saturdays", hours: "10am-4pm", subscriptionDays: [6], isActive: true, sortOrder: 0, phoneNumber: "1" },
    { id: "st-2", name: "Lekki station", address: "2 Lekki Rd", dayOfWeek: "By appointment", hours: "10am-4pm", subscriptionDays: [], isActive: true, sortOrder: 1, phoneNumber: "1" },
  ],
  api: { getProduct: async () => ({ variants: [] }) },
}));

const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null, user: { id: "u1" }, walletBalance: 5000, signOut: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

// Pieces that bring their own providers or the map are stood in for.
vi.mock("@/components/layout/MobileMenu", () => ({ MobileMenu: () => <button type="button">menu</button> }));
vi.mock("@/components/cart/HeaderCartIcon", () => ({ HeaderCartIcon: () => <button type="button">cart</button> }));
vi.mock("@/components/auth/SignInForm", () => ({ SignInForm: ({ title }: { title: string }) => <div>{title}</div> }));
vi.mock("@/components/checkout/CheckoutPaymentView", () => ({
  CheckoutPaymentView: (p: { orderId: string; totalAmount: number; token: string; walletBalance?: number; hideGiftCardRedeem?: boolean; onPaymentConfirmed: () => void; onBack: () => void }) => (
    <div>
      <p>pay screen {p.orderId} {p.totalAmount} token:[{p.token}] hideGift:{String(!!p.hideGiftCardRedeem)} wallet:{p.walletBalance}</p>
      <button type="button" onClick={p.onPaymentConfirmed}>I have paid</button>
      <button type="button" onClick={p.onBack}>back</button>
    </div>
  ),
}));
vi.mock("@/components/checkout/CheckoutAddressSection", () => ({
  CheckoutAddressSection: ({ onSelectAddress }: { onSelectAddress: (a: string, lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onSelectAddress("9 Ikoyi Rd, Lagos", 6.45, 3.43)}>pick an address</button>
  ),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { toast } from "sonner";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


// ---- fixtures -------------------------------------------------------------------------------
const line = (over = {}) => ({
  id: "l1", subscriptionId: "s1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3",
  imageUrl: null, quantity: 2, unitPriceKobo: 450_000, lineTotalKobo: 900_000, dueDate: "2026-11-25", kind: "subscription" as const, ...over,
});
const box = (over: Partial<Box> = {}): Box => ({
  id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
  delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
  needsDelivery: false,
  items: [line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes", variantLabel: "80 sheets", quantity: 1, unitPriceKobo: 240_000, lineTotalKobo: 240_000 })],
  subtotalKobo: 1_140_000, deliveryFeeKobo: 50_000, totalKobo: 1_190_000, order: null, canPay: true, canUndoSkip: false,
  openDays: [{ date: "2026-11-28", confirmBy: "2026-11-27T15:00:00.000Z" }],
  ...over,
});
const item = (over: Partial<SubscribedItem> = {}): SubscribedItem => ({
  id: "s1", status: "active", variantId: "v1", productId: "p1", productName: "Kisskids Diapers", brand: "Kisskids", slug: "kisskids-diapers",
  variantLabel: "Size 3", imageUrl: null, quantity: 2, unitPriceKobo: 450_000, regularPriceKobo: 500_000, subscriptionPriceKobo: 450_000, recommendedFrequencyWeeks: 4,
  frequency: { kind: "weeks", every: 4 }, frequencyLabel: "Every 4 weeks", nextDue: "2026-11-25", boxId: "b1", problem: null, enrolSource: null, ...over,
});
const tab = (over: Partial<MyBoxes> = {}): MyBoxes => ({
  boxes: [box()],
  items: [item(), item({ id: "s2", productName: "Baby wipes", variantLabel: "80 sheets", quantity: 1, frequencyLabel: "Every 2 weeks", frequency: { kind: "weeks", every: 2 } })],
  defaultDelivery: null,
  ...over,
});

function show(props: Parameters<typeof SubscriptionTab>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubscriptionTab {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const ok = { ok: true };

beforeEach(() => {
  vi.clearAllMocks();
  auth.value = { session: { access_token: "tok" }, user: { id: "u1" }, walletBalance: 5000, signOut: vi.fn() };
  api.mine.mockResolvedValue(tab());
  api.offer.mockResolvedValue({ state: "none", orderNumber: null, eligible: [], subscribed: [] });
  api.deliveryOptions.mockResolvedValue({ community: { feeKobo: 50_000 }, instant: { feeKobo: 150_000 } });
  for (const fn of [api.skip, api.undoSkip, api.leaveOut, api.moveDay, api.changeLocation, api.setQuantity, api.setVariant, api.setFrequency, api.pause, api.resume, api.stop]) fn.mockResolvedValue(ok);
});

describe("the next order", () => {
  it("shows the day, how and where it goes, what is in it, and what it costs", async () => {
    show();
    expect(await screen.findByRole("heading", { name: "Tue 24 Nov" })).toBeInTheDocument();
    const card = within(screen.getByRole("region", { name: "Next order" }));
    // How it comes, then where, kept to two lines (a long address is cut short).
    const place = card.getByText("12 Soluyi Road");
    expect(place).toHaveTextContent("Community Delivery: 12 Soluyi Road");
    expect(place).toHaveClass("line-clamp-2");
    expect(card.getByText("Community Delivery:")).toHaveClass("font-semibold");
    expect(card.getByText("Kisskids Diapers ×2")).toBeInTheDocument();
    expect(card.getByText("Kisskids Baby wipes ×1")).toBeInTheDocument();
    expect(card.getByText("₦11,900")).toBeInTheDocument();
    expect(card.getByText("Items ₦11,400")).toBeInTheDocument();
    expect(card.getByText("Delivery ₦500")).toBeInTheDocument();
  });

  it("has the design's four buttons and no pay-by line", async () => {
    show();
    await screen.findByRole("heading", { name: "Tue 24 Nov" });
    const card = within(screen.getByRole("region", { name: "Next order" }));
    expect(card.getAllByRole("button").map((b) => b.textContent)).toEqual(expect.arrayContaining(["Pay now", "Make changes", "Skip", "Add extra items"]));
    expect(card.queryByText(/Pay by/)).toBeNull();
  });

  it("has a page title like Gifting and Contact: no header bar, no menu button and no cart", async () => {
    show();
    await screen.findByRole("heading", { name: "Tue 24 Nov" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Subscription$/);
    expect(screen.queryByRole("button", { name: "menu" })).toBeNull();
    expect(screen.queryByRole("button", { name: "cart" })).toBeNull();
    expect(document.querySelector("header")).toBeNull();
  });

  it("calls the list 'Your subscribed items', and gives each item its next date", async () => {
    show();
    expect(await screen.findByText("Your subscribed items", { selector: "h3" })).toBeInTheDocument();
    expect(screen.queryByText("Your items", { selector: "h3" })).toBeNull();
    const list = within(screen.getByRole("list", { name: "Your subscribed items" }));
    expect(list.getAllByText(/^Next: /)).toHaveLength(2);
    expect(list.queryByText(/^Due: /)).toBeNull();
  });

  it("lists her items, with how often and when each is next due", async () => {
    show();
    const list = within(await screen.findByRole("list", { name: "Your subscribed items" }));
    expect(list.getByText("Every 4 weeks")).toBeInTheDocument();
    expect(list.getByText("Every 2 weeks")).toBeInTheDocument();
    expect(list.getAllByText("Next: Wed 25 Nov")).toHaveLength(2);
  });

  it("says Instant Delivery for an order going by Instant", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ delivery: { type: "instant", zoneName: null, address: "3 Faramobi Ajike St, Anthony, Lagos", lat: 6.56, lng: 3.37, pickupStationId: null, pickupStationName: null } })] }));
    show();
    expect(await screen.findByText("3 Faramobi Ajike St, Anthony, Lagos")).toHaveTextContent("Instant Delivery: 3 Faramobi Ajike St, Anthony, Lagos");
  });

  it("says pick-up is free", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ delivery: { type: "pickup", zoneName: null, address: null, lat: null, lng: null, pickupStationId: "st-1", pickupStationName: "Yaba station" }, deliveryFeeKobo: 0, totalKobo: 1_140_000 })] }));
    show();
    expect(await screen.findByText("Delivery Free")).toBeInTheDocument();
    expect(screen.getByText("Yaba station")).toHaveTextContent("Pick-up: Yaba station");
  });

  it("two orders waiting: only the soonest shows, no carousel; the later one waits its turn", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box(), box({ id: "b2", deliveryDate: "2026-12-08" })] }));
    show();
    expect(await screen.findByRole("region", { name: "Next order" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Order on Tue 8 Dec" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Your orders" })).toBeNull();
    expect(screen.queryByText("LATER ORDER")).toBeNull();
  });

  it("once the first is paid, the next waiting one shows beside it", async () => {
    api.mine.mockResolvedValue(
      tab({ boxes: [box({ status: "paid", editable: false, canPay: false }), box({ id: "b2", deliveryDate: "2026-12-08" }), box({ id: "b3", deliveryDate: "2026-12-22" })] }),
    );
    show();
    const slides = within(await screen.findByRole("region", { name: "Your orders" })).getAllByRole("group");
    expect(slides).toHaveLength(2);
    expect(within(slides[0]).getByRole("heading", { name: "Tue 8 Dec" })).toBeInTheDocument();
    expect(within(slides[1]).getByText("PAID")).toBeInTheDocument();
  });

  it("a message about a later order opens on that order", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box(), box({ id: "b2", deliveryDate: "2026-12-08" })], linkBoxId: "b2" }));
    show();
    expect(await screen.findByRole("heading", { name: "Tue 8 Dec" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tue 24 Nov" })).toBeNull();
  });
});

describe("the empty and quiet states", () => {
  it("invites her to the shop when nothing is subscribed", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [], items: [] }));
    show();
    expect(await screen.findByText("Never forget to order again")).toBeInTheDocument();
    // the design: three steps in the card, a dashed button to pick an item, and the title in the plural
    expect(screen.getByText("You get reminders")).toBeInTheDocument();
    expect(screen.getByText("You simply pay, no reordering")).toBeInTheDocument();
    expect(screen.getByText("You remain in control")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Subscribe to an item" })).toHaveAttribute("href", "/subscriptions/add");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Subscriptions");
    // signed in, the card keeps its steps: the WhatsApp example and the login button are for visitors not signed in
    expect(screen.queryByRole("figure", { name: "An example WhatsApp reminder" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Log in/ })).toBeNull();
  });

  it("the title is 'Subscription' (singular) once she has items", async () => {
    show();
    await screen.findByRole("heading", { name: "Tue 24 Nov" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Subscription$/);
  });

  it("offers a way to subscribe to something else as the dashed first button of her items, as the design does", async () => {
    show();
    const list = await screen.findByRole("list", { name: "Your subscribed items" });
    const link = within(list).getByRole("link", { name: "Subscribe to something else" });
    expect(link).toHaveAttribute("href", "/subscriptions/add");
    expect(link).toHaveClass("border-dashed");
    // first in the list, ahead of her items
    expect(list.querySelector("li")).toContainElement(link);
  });

  it("says nothing is due when items exist but no order does yet", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [] }));
    show();
    expect(await screen.findByRole("region", { name: "Nothing to pay right now" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Your subscribed items" })).toBeInTheDocument();
  });

  it("with nothing to pay, shows the upcoming order like an order card: the day, what is in it, and nothing to pay (the earliest only)", async () => {
    api.mine.mockResolvedValue(
      tab({
        boxes: [],
        items: [
          item({ nextDue: "2026-12-08" }),
          item({ id: "s2", productName: "Baby wipes", quantity: 1, nextDue: "2026-12-08" }),
          item({ id: "s3", productName: "Nappy cream", quantity: 1, nextDue: "2026-12-22" }),
          item({ id: "s4", productName: "Baby oil", quantity: 1, nextDue: "2026-12-01", status: "paused" }),
        ],
      }),
    );
    show();
    const card = within(await screen.findByRole("region", { name: "Nothing to pay right now" }));
    expect(card.getByText("UPCOMING ORDER")).toBeInTheDocument();
    expect(card.getByRole("heading", { name: "Tue 8 Dec" })).toBeInTheDocument();
    expect(card.getByText("Kisskids Diapers ×2")).toBeInTheDocument();
    expect(card.getByText("Kisskids Baby wipes ×1")).toBeInTheDocument();
    expect(card.queryByText(/Nappy cream|Baby oil/)).toBeNull();
    expect(card.getByRole("status")).toHaveTextContent("Nothing to pay right now. We will remind you before it is due.");
  });

  it("with everything paused, says so and shows no date", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [], items: [item({ status: "paused" })] }));
    show();
    const card = within(await screen.findByRole("region", { name: "Nothing to pay right now" }));
    expect(card.getByText("ALL PAUSED")).toBeInTheDocument();
    expect(card.getByRole("status")).toHaveTextContent("Your items are paused. Resume one to get your next order.");
    expect(card.queryByText("UPCOMING ORDER")).toBeNull();
  });

  it("offers to try again when it cannot load", async () => {
    api.mine.mockRejectedValueOnce(new BoxApiError("down", 500));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Tue 24 Nov" })).toBeInTheDocument();
  });

  it("asks her to sign in when a link no longer works", async () => {
    api.mine.mockRejectedValue(new BoxApiError("nope", 401));
    show({ linkAction: "pay" });
    expect(await screen.findByText("Sign in to see your subscription")).toBeInTheDocument();
  });

  it("says so when a link was sent to another account", async () => {
    api.mine.mockRejectedValue(new BoxApiError("other", 403, BOX_CODES.linkOtherAccount));
    show({ linkAction: "pay" });
    expect(await screen.findByText("This link is for another account")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.value.signOut).toHaveBeenCalled();
  });
});

describe("how often, on the tab", () => {
  it("a monthly item reads short on its row: Every 25th, Every 2nd Monday", async () => {
    api.mine.mockResolvedValue(
      tab({
        items: [
          item({ frequency: { kind: "month_date", day: 25 }, frequencyLabel: "On the 25th of every month" }),
          item({ id: "s2", productName: "Baby wipes", frequency: { kind: "month_weekday", nth: 2, weekday: 1 }, frequencyLabel: "The 2nd Monday of every month" }),
        ],
      }),
    );
    show();
    expect(await screen.findByText("Every 25th")).toBeInTheDocument();
    expect(screen.getByText("Every 2nd Monday")).toBeInTheDocument();
    expect(screen.queryByText("On the 25th of every month")).toBeNull();
  });
});

describe("Pay now", () => {
  it("makes the order with the total she saw, then opens the pay screen for it", async () => {
    api.pay.mockResolvedValue({ orderNumber: "NSTABC123", totalKobo: 1_190_000, claimToken: null });
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    expect(await screen.findByText(/pay screen NSTABC123 1190000 token:\[tok\] hideGift:false wallet:5000/)).toBeInTheDocument();
    expect(api.pay).toHaveBeenCalledWith("tok", "b1", 1_190_000);
    expect(storeClaimToken).not.toHaveBeenCalled();
  });

  it("someone who opened a link has no sign-in: the order's key is kept and the pay screen has no gift card or wallet", async () => {
    auth.value = { session: null, user: null as never, walletBalance: null as never, signOut: vi.fn() };
    api.pay.mockResolvedValue({ orderNumber: "NSTABC123", totalKobo: 1_190_000, claimToken: "claim-key" });
    show({ linkAction: "pay" });
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    expect(await screen.findByText(/pay screen NSTABC123 1190000 token:\[\] hideGift:true wallet:0/)).toBeInTheDocument();
    expect(storeClaimToken).toHaveBeenCalledWith("NSTABC123", "claim-key");
  });

  it("comes back to the tab from the pay screen, and again after she says she paid", async () => {
    api.pay.mockResolvedValue({ orderNumber: "NSTABC123", totalKobo: 1_190_000, claimToken: null });
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    fireEvent.click(await screen.findByRole("button", { name: "back" }));
    expect(await screen.findByRole("heading", { name: "Tue 24 Nov" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pay now/ }));
    fireEvent.click(await screen.findByRole("button", { name: "I have paid" }));
    expect(await screen.findByRole("heading", { name: "Tue 24 Nov" })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Payment made. We are confirming it.");
  });

  it("tells the page while the pay screen is open, so it can hide the bottom navigation", async () => {
    api.pay.mockResolvedValue({ orderNumber: "NSTABC123", totalKobo: 1_190_000, claimToken: null });
    const onPayScreen = vi.fn();
    show({ onPayScreen });
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    await waitFor(() => expect(onPayScreen).toHaveBeenLastCalledWith(true));
    fireEvent.click(await screen.findByRole("button", { name: "back" }));
    await waitFor(() => expect(onPayScreen).toHaveBeenLastCalledWith(false));
  });

  it("tells her when the price moved, and does not open the pay screen", async () => {
    api.pay.mockRejectedValue(new BoxApiError("changed", 409, BOX_CODES.totalChanged, { totalKobo: 1_300_000 }));
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/price has changed/)));
    expect(screen.queryByText(/pay screen/)).toBeNull();
    expect(api.mine.mock.calls.length).toBeGreaterThan(1); // read again, to show the new total
  });

  it("opens the location drawer when delivery is no longer offered there", async () => {
    api.pay.mockRejectedValue(new BoxApiError("moved", 409, BOX_CODES.deliveryChanged));
    show();
    fireEvent.click(await screen.findByRole("button", { name: /Pay now/ }));
    expect(await screen.findByText("How should this order reach you?")).toBeInTheDocument();
  });

  it("says 'Continue to pay' for an order she already started", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ order: { orderNumber: "NSTABC123", status: "order_submitted" } })] }));
    show();
    expect(await screen.findByRole("button", { name: /Continue to pay/ })).toBeInTheDocument();
  });

  it("once she said she paid, shows that we are confirming, with no buttons to change it", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ editable: false, canPay: false, order: { orderNumber: "NSTABC123", status: "payment_made" } })] }));
    show();
    expect(await screen.findByText(/We are confirming it/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pay now|Continue to pay|Make changes|Skip/ })).toBeNull();
  });

  it("shows a paid order as paid", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ status: "paid", editable: false, canPay: false })] }));
    show();
    expect(await screen.findByText("PAID")).toBeInTheDocument();
    expect(screen.getByText(/It is coming Tue 24 Nov/)).toBeInTheDocument();
    expect(screen.getByTestId("paid-check")).toHaveClass("bg-[#2F8F4E]");
  });

  it("one paid and one to pay: a carousel, the one to pay first as the next order, then the paid one", async () => {
    api.mine.mockResolvedValue(
      tab({
        boxes: [
          box({ id: "b0", status: "paid", deliveryDate: "2026-11-21", editable: false, canPay: false }),
          box({ id: "b1", deliveryDate: "2026-11-24" }),
        ],
      }),
    );
    show();
    const carousel = await screen.findByRole("region", { name: "Your orders" });
    const slides = within(carousel).getAllByRole("group");
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual(["1 of 2", "2 of 2"]);
    expect(within(slides[0]).getByText("NEXT ORDER")).toBeInTheDocument();
    expect(within(slides[0]).getByRole("button", { name: /Pay now/ })).toBeInTheDocument();
    expect(within(slides[1]).getByText("PAID")).toBeInTheDocument();
    expect(within(carousel).getAllByRole("button", { name: /^Show order/ })).toHaveLength(2);
  });

  it("one order: no carousel", async () => {
    show();
    expect(await screen.findByText("NEXT ORDER")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your orders" })).toBeNull();
  });

  it("will not let her pay until she says where to deliver", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ needsDelivery: true, canPay: false, deliveryFeeKobo: null, totalKobo: null, delivery: { type: null, zoneName: null, address: null, lat: null, lng: null, pickupStationId: null, pickupStationName: null } })] }));
    show();
    expect(await screen.findByText("Tell us where to deliver, then you can pay.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pay now/ })).toBeNull();
    // The address line and the big button both say it; either opens the location drawer.
    fireEvent.click(screen.getAllByRole("button", { name: "Add a delivery address" }).at(-1) as HTMLElement);
    expect(await screen.findByText("How should this order reach you?")).toBeInTheDocument();
  });
});

describe("Skip", () => {
  it("skips the order, and reads the tab again to show it", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(() => expect(api.skip).toHaveBeenCalledWith("tok", "b1"));
    await waitFor(() => expect(api.mine.mock.calls.length).toBeGreaterThan(1));
  });

  it("shows a skipped order as skipped, with the next one, and undo calls the server", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ status: "skipped", editable: false, canPay: false, canUndoSkip: true })], items: [item({ nextDue: "2026-12-22" })] }));
    show();
    expect(await screen.findByText("You skipped Tue 24 Nov.")).toBeInTheDocument();
    expect(screen.getByText(/Your next order is Tue 22 Dec/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(api.undoSkip).toHaveBeenCalledWith("tok", "b1"));
  });

  it("with nothing else coming up, the skipped order stays as the page's card, now showing the next day and what is in it, as the design does", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ status: "skipped", editable: false, canPay: false, canUndoSkip: true })], items: [item({ nextDue: "2026-12-22" })] }));
    show();
    await screen.findByText("You skipped Tue 24 Nov.");
    const card = within(screen.getByRole("region", { name: "Skipped order" }));
    expect(card.getByText("NEXT ORDER")).toBeInTheDocument();
    expect(card.getByRole("heading", { name: "Tue 22 Dec" })).toBeInTheDocument();
    expect(card.getByText("Kisskids Diapers ×2")).toBeInTheDocument();
    expect(card.queryByRole("button", { name: "Pay now" })).toBeNull();
  });

  it("with another order already waiting, the skipped one is just the line and the way back", async () => {
    api.mine.mockResolvedValue(
      tab({
        boxes: [box({ status: "skipped", editable: false, canPay: false, canUndoSkip: true }), box({ id: "b2", deliveryDate: "2026-12-08" })],
        items: [item({ nextDue: "2026-12-08" })],
      }),
    );
    show();
    await screen.findByText("You skipped Tue 24 Nov.");
    expect(screen.getByRole("region", { name: "Skipped order" }).querySelector("h2")).toBeNull();
    expect(screen.getByRole("heading", { name: "Tue 8 Dec" })).toBeInTheDocument();
  });

  it("offers no undo once the pay-by time has passed", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ status: "skipped", editable: false, canPay: false, canUndoSkip: false })] }));
    show();
    await screen.findByText("You skipped Tue 24 Nov.");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });
});

describe("Make changes", () => {
  const open = async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Make changes" }));
    return screen.findByText("What would you like to change?");
  };

  it("offers to remove an item, change the day and change the place", async () => {
    await open();
    expect(screen.getByRole("button", { name: /Remove an item/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change delivery date.*Tue 24 Nov/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change delivery method.*Community Delivery/ })).toBeInTheDocument();
  });

  it("removes one item from this order", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Remove an item/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove Baby wipes" }));
    await waitFor(() => expect(api.leaveOut).toHaveBeenCalledWith("tok", "b1", "s2"));
  });

  it("will not remove the last item, and says why", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ items: [line()] })] }));
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Remove an item/ }));
    expect(await screen.findByRole("button", { name: "Remove Kisskids Diapers" })).toBeDisabled();
    expect(screen.getByText(/An order needs at least one item/)).toBeInTheDocument();
  });

  it("moves the order to another day she is offered", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change delivery date/ }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.click(await screen.findByRole("button", { name: "Sat 28 Nov" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.moveDay).toHaveBeenCalledWith("tok", "b1", "2026-11-28"));
  });

  it("sends it to a pick-up station that takes subscription orders, for this order only", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change delivery method/ }));
    fireEvent.click(await screen.findByRole("button", { name: /^Pick-up/ }));
    expect(await screen.findByRole("button", { name: /Lekki station/ })).toBeDisabled();
    expect(screen.getByText("Not taking subscription orders yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yaba station/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.changeLocation).toHaveBeenCalledWith("tok", "b1", { method: "pickup", pickupStationId: "st-1", scope: "box" }));
  });

  it("sends it to a new address, and can make that her default for future orders", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change delivery method/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Change address" }));
    fireEvent.click(await screen.findByRole("button", { name: "pick an address" }));
    fireEvent.click(screen.getByRole("radio", { name: "This and my future orders" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()); // once the options for that address are in
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.changeLocation).toHaveBeenCalledWith("tok", "b1", { method: "address", address: "9 Ikoyi Rd, Lagos", lat: 6.45, lng: 3.43, speed: "community", scope: "future" }),
    );
  });

  it("the address button for Community and Instant Delivery says 'Change address', and there is no 'Now:' line under the options", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change delivery method/ }));
    expect(await screen.findByRole("button", { name: "Change address" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add a new address" })).toBeNull();
    expect(screen.queryByText(/^Now:/)).toBeNull();
  });

  describe("choosing how it is delivered", () => {
    const IN_AREA = { community: { feeKobo: 50_000 }, instant: { feeKobo: 150_000 } };
    const OUT_OF_AREA = { community: null, instant: { feeKobo: 150_000 } };
    const openMethods = async () => {
      await open();
      fireEvent.click(screen.getByRole("button", { name: /Change delivery method/ }));
      await screen.findByText("How should this order reach you?");
    };
    const pills = () => Array.from(document.querySelectorAll("[aria-pressed]")).map((b) => b.textContent?.split(" · ")[0]);

    it("inside a community area: Community Delivery, Instant Delivery and Pick-up, in that order, with the one she has now chosen", async () => {
      await openMethods();
      await waitFor(() => expect(api.deliveryOptions).toHaveBeenCalledWith("tok", "b1", 6.55, 3.38));
      expect(pills()).toEqual(["Community Delivery", "Instant Delivery", "Pick-up"]);
      expect(screen.getByRole("button", { name: /^Community Delivery/ })).toHaveAttribute("aria-pressed", "true");
      expect(await screen.findByText("Community Delivery · ₦500")).toBeInTheDocument();
    });

    it("outside every area: Instant Delivery and Pick-up only", async () => {
      api.deliveryOptions.mockResolvedValue(OUT_OF_AREA);
      await openMethods();
      await waitFor(() => expect(pills()).toEqual(["Instant Delivery", "Pick-up"]));
      expect(screen.getByRole("button", { name: /^Instant Delivery/ })).toHaveAttribute("aria-pressed", "true");
      expect(await screen.findByText("Instant Delivery · ₦1,500")).toBeInTheDocument();
    });

    it("choosing Instant inside an area says it is for this order only, takes away the 'future orders' choice, and sends Instant for this box", async () => {
      await openMethods();
      fireEvent.click(await screen.findByRole("button", { name: /^Instant Delivery/ }));
      expect(await screen.findByText("Instant Delivery · ₦1,500")).toBeInTheDocument();
      expect(screen.getByText(/Instant Delivery is for this order only/)).toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: "This and my future orders" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(api.changeLocation).toHaveBeenCalledWith("tok", "b1", { method: "address", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, speed: "instant", scope: "box" }),
      );
    });

    it("going back to Community Delivery brings the 'future orders' choice back", async () => {
      await openMethods();
      fireEvent.click(await screen.findByRole("button", { name: /^Instant Delivery/ }));
      expect(screen.queryByRole("radio", { name: "This and my future orders" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /^Community Delivery/ }));
      expect(screen.getByRole("radio", { name: "This and my future orders" })).toBeInTheDocument();
    });

    it("Instant outside an area can still be kept for future orders (it is that address's only way)", async () => {
      api.deliveryOptions.mockResolvedValue(OUT_OF_AREA);
      await openMethods();
      await screen.findByText("Instant Delivery · ₦1,500");
      fireEvent.click(screen.getByRole("radio", { name: "This and my future orders" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(api.changeLocation).toHaveBeenCalledWith("tok", "b1", { method: "address", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, speed: "instant", scope: "future" }),
      );
    });

    it("a new address outside the area takes Community Delivery off the list, and what she had picked moves to Instant", async () => {
      api.deliveryOptions.mockImplementation(async (_t: string, _b: string, lat: number) => (lat === 6.45 ? OUT_OF_AREA : IN_AREA));
      await openMethods();
      await waitFor(() => expect(pills()).toEqual(["Community Delivery", "Instant Delivery", "Pick-up"]));
      fireEvent.click(await screen.findByRole("button", { name: "Change address" }));
      fireEvent.click(await screen.findByRole("button", { name: "pick an address" })); // 6.45, 3.43: outside
      await waitFor(() => expect(pills()).toEqual(["Instant Delivery", "Pick-up"]));
      expect(screen.getByRole("button", { name: /^Instant Delivery/ })).toHaveAttribute("aria-pressed", "true");
    });

    it("cannot be saved for a new address until the server has said which methods it supports (so the dearer one is never saved by accident)", async () => {
      let answer: (o: typeof IN_AREA) => void = () => undefined;
      api.deliveryOptions.mockImplementation((_t: string, _b: string, lat: number) => (lat === 6.45 ? new Promise((resolve) => (answer = resolve)) : Promise.resolve(IN_AREA)));
      await openMethods();
      fireEvent.click(await screen.findByRole("button", { name: "Change address" }));
      fireEvent.click(await screen.findByRole("button", { name: "pick an address" }));
      expect(await screen.findByText("Checking how we can deliver there…")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      answer(IN_AREA);
      await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
      expect(screen.queryByText("Checking how we can deliver there…")).toBeNull();
    });

    it("where nothing delivers, only Pick-up is left, and she is told", async () => {
      api.deliveryOptions.mockResolvedValue({ community: null, instant: null });
      await openMethods();
      await waitFor(() => expect(pills()).toEqual(["Pick-up"]));
    });

    it("while the options load, or if they cannot be loaded, she still sees her current method, Instant and Pick-up", async () => {
      api.deliveryOptions.mockRejectedValue(new Error("down"));
      await openMethods();
      await waitFor(() => expect(api.deliveryOptions).toHaveBeenCalled());
      expect(pills()).toEqual(["Community Delivery", "Instant Delivery", "Pick-up"]);
    });

    it("shows no price when it cannot be worked out, but still offers the method", async () => {
      api.deliveryOptions.mockResolvedValue({ community: { feeKobo: null }, instant: { feeKobo: null } });
      await openMethods();
      await waitFor(() => expect(api.deliveryOptions).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: /^Instant Delivery/ })).toBeInTheDocument();
      expect(screen.queryByText(/Community Delivery ·/)).toBeNull();
    });

    it("an order that goes to Instant now shows Instant Delivery on the menu", async () => {
      api.mine.mockResolvedValue(tab({ boxes: [box({ delivery: { type: "instant", zoneName: null, address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null } })] }));
      await open();
      expect(screen.getByRole("button", { name: /Change delivery method.*Instant Delivery/ })).toBeInTheDocument();
    });
  });
});

describe("an item", () => {
  const open = async (name = "Kisskids Diapers") => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: `Manage ${name}` }));
    return screen.findByRole("button", { name: /Change quantity/ });
  };

  it("changes the quantity", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change quantity/ }));
    fireEvent.click(await screen.findByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.setQuantity).toHaveBeenCalledWith("tok", "s1", 3));
  });

  it("cannot save a quantity it already has", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change quantity/ }));
    expect(await screen.findByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("changes how often, from the three ways, and says when the next one is now", async () => {
    api.setFrequency.mockResolvedValue({ nextDue: "2026-12-25" });
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change renewal frequency/ }));
    fireEvent.click(await screen.findByRole("radio", { name: "Monthly, on a particular date" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.setFrequency).toHaveBeenCalledWith("tok", "s1", { kind: "month_date", day: 25 }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Saved. Next one: Fri 25 Dec."));
  });

  it("reads the tab again after a frequency change, so the new day and order show", async () => {
    api.setFrequency.mockResolvedValue({ nextDue: "2026-12-08" });
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Change renewal frequency/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Fewer weeks" }));
    const before = api.mine.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.mine.mock.calls.length).toBeGreaterThan(before));
  });

  it("pauses it, after a confirmation", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(await screen.findByText("Pause Kisskids Diapers?")).toBeInTheDocument();
    expect(api.pause).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Pause" }).at(-1) as HTMLElement);
    await waitFor(() => expect(api.pause).toHaveBeenCalledWith("tok", "s1"));
  });

  it("stops it, after a confirmation that can be backed out of", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /Stop subscription/ }));
    expect(await screen.findByText("Stop subscribing to Kisskids Diapers?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop subscription" }));
    await waitFor(() => expect(api.stop).toHaveBeenCalledWith("tok", "s1"));
  });

  it("offers Resume for a paused item", async () => {
    api.mine.mockResolvedValue(tab({ items: [item({ status: "paused", nextDue: null })] }));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Manage Kisskids Diapers" }));
    fireEvent.click(await screen.findByRole("button", { name: /Resume/ }));
    expect(await screen.findByText("Resume Kisskids Diapers?")).toBeInTheDocument();
    expect(screen.getAllByText("Paused").length).toBeGreaterThan(0);
  });

  it("says why an item is not in an order", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [], items: [item({ boxId: null, problem: "station_without_weekday" })] }));
    show();
    expect(await screen.findByText(/not available for subscriptions/)).toBeInTheDocument();
  });
});

describe("a link from a message", () => {
  it("'edit' opens Make changes on the order the message was about", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ id: "b1" }), box({ id: "b2", deliveryDate: "2026-12-08" })], linkBoxId: "b2" }));
    show({ linkAction: "edit" });
    expect(await screen.findByText("What would you like to change?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Change delivery date/ }));
    expect(await screen.findByText("Tue 8 Dec", { selector: "button *, button" })).toBeInTheDocument();
  });

  it("'pay' just opens the tab, with no drawer", async () => {
    show({ linkAction: "pay" });
    await screen.findByRole("heading", { name: "Tue 24 Nov" });
    expect(screen.queryByText("What would you like to change?")).toBeNull();
  });

  it("'resume' lists what is paused, with a button to turn each back on", async () => {
    api.mine.mockResolvedValue(tab({ items: [item({ status: "paused", nextDue: null })] }));
    show({ linkAction: "resume" });
    expect(await screen.findByText("These are paused. Turn on the ones you want.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Turn on Kisskids Diapers" }));
    await waitFor(() => expect(api.resume).toHaveBeenCalledWith("tok", "s1"));
  });

  it("the signed-in tab does not open any drawer by itself", async () => {
    show();
    await screen.findByRole("heading", { name: "Tue 24 Nov" });
    expect(screen.queryByText("What would you like to change?")).toBeNull();
  });
});

describe("a refusal from the server", () => {
  it("is shown in words, and the tab is read again", async () => {
    api.leaveOut.mockRejectedValue(new BoxApiError("Payment has already been made for this box, so it can no longer be changed", 409, BOX_CODES.paymentStarted));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Make changes" }));
    fireEvent.click(await screen.findByRole("button", { name: /Remove an item/ }));
    const before = api.mine.mock.calls.length;
    fireEvent.click(await screen.findByRole("button", { name: "Remove Baby wipes" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This order can no longer be changed."));
    await waitFor(() => expect(api.mine.mock.calls.length).toBeGreaterThan(before));
  });
});

describe("when the switch is turned off while she is looking", () => {
  it("forgets that it was on, so the page falls back to the old one", async () => {
    api.mine.mockRejectedValue(new BoxApiError("Not Found", 404));
    show();
    await waitFor(() => expect(resetSubscribeEnabled).toHaveBeenCalled());
  });

  it("does not forget it for an ordinary failure", async () => {
    api.mine.mockRejectedValue(new BoxApiError("down", 500));
    show();
    await screen.findByRole("button", { name: "Try again" });
    expect(resetSubscribeEnabled).not.toHaveBeenCalled();
  });
});

describe("an item row's name and how many", () => {
  it("with no size or type, how many sits on the name's line", async () => {
    api.mine.mockResolvedValue(tab({ items: [item({ variantLabel: null, quantity: 1 })] }));
    show();
    const row = within(await screen.findByRole("button", { name: "Manage Kisskids Diapers" }));
    const name = row.getByText((_, el) => el?.textContent === "Kisskids Diapers ×1" && el.classList.contains("font-semibold"));
    expect(within(name).getByText("×1")).toHaveClass("font-normal");
  });

  it("with a size, how many goes beside it, under the name", async () => {
    show();
    const row = within(await screen.findByRole("button", { name: "Manage Kisskids Diapers" }));
    expect(row.getByText("Kisskids Diapers")).toBeInTheDocument();
    expect(row.getByText("Size 3 · ×2")).toBeInTheDocument();
  });
});

describe("the order of her subscribed items", () => {
  it("soonest due first, paused ones last", async () => {
    api.mine.mockResolvedValue(
      tab({
        items: [
          item({ id: "a", productName: "Kisskids Later", nextDue: "2026-12-28" }),
          item({ id: "b", productName: "Kisskids Paused", status: "paused", nextDue: null }),
          item({ id: "c", productName: "Kisskids Soonest", nextDue: "2026-12-01" }),
          item({ id: "d", productName: "Kisskids Middle", nextDue: "2026-12-24" }),
        ],
      }),
    );
    show();
    const list = within(await screen.findByRole("list", { name: "Your subscribed items" }));
    const names = list.getAllByRole("button", { name: /^Manage / }).map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["Manage Kisskids Soonest", "Manage Kisskids Middle", "Manage Kisskids Later", "Manage Kisskids Paused"]);
  });
});
