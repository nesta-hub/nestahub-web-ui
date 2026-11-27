import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingExtrasProvider, usePendingExtras } from "@/contexts/PendingExtrasContext";
import type { Box, MyBoxes } from "@/lib/subscriptionBoxes";
import { MakeChangesDrawer } from "./MakeChangesDrawer";
import { SubscriptionTab } from "./SubscriptionTab";

// ---- what the tab talks to (the same stand-ins as SubscriptionTab.test.tsx) -------------------
const api = vi.hoisted(() => ({
  mine: vi.fn(),
  leaveOut: vi.fn(),
  removeExtra: vi.fn(),
}));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ resetSubscribeEnabled: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...(await original<typeof import("@/lib/api")>()), getPickupStations: async () => [] }));

const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null, user: { id: "u1" }, walletBalance: 5000, signOut: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

vi.mock("@/components/layout/MobileMenu", () => ({ MobileMenu: () => <button type="button">menu</button> }));
vi.mock("@/components/cart/HeaderCartIcon", () => ({ HeaderCartIcon: () => <button type="button">cart</button> }));
vi.mock("@/components/checkout/CheckoutAddressSection", () => ({
  CheckoutAddressSection: ({ headerAction }: { headerAction?: React.ReactNode }) => (
    <div data-testid="address-search">
      <h3>Enter Delivery Address</h3>
      {headerAction}
    </div>
  ),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// ---- fixtures -------------------------------------------------------------------------------
const line = (over = {}) => ({
  id: "l1", subscriptionId: "s1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3",
  imageUrl: null, quantity: 2, unitPriceKobo: 450_000, lineTotalKobo: 900_000, dueDate: "2026-11-25", kind: "subscription" as const, ...over,
});
/** Something she added to this one order: not a subscription. */
const extra = (over = {}) => line({ id: "x1", subscriptionId: null, variantId: "v9", productName: "Nappy cream", variantLabel: "100g", quantity: 3, unitPriceKobo: 310_000, lineTotalKobo: 930_000, dueDate: null, kind: "one_time", ...over });
const box = (over: Partial<Box> = {}): Box => ({
  id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
  delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
  needsDelivery: false,
  items: [line(), line({ id: "l2", subscriptionId: "s2", variantId: "v2", productName: "Baby wipes", variantLabel: "80 sheets", quantity: 1, unitPriceKobo: 240_000, lineTotalKobo: 240_000 }), extra()],
  subtotalKobo: 2_070_000, deliveryFeeKobo: 50_000, totalKobo: 2_120_000, order: null, canPay: true, canUndoSkip: false,
  openDays: [],
  ...over,
});
const tab = (over: Partial<MyBoxes> = {}): MyBoxes => ({ boxes: [box()], items: [], defaultDelivery: null, ...over });

function Probe() {
  const { boxId } = usePendingExtras();
  const { pathname } = useLocation();
  return (
    <output>
      at:{pathname} for:{boxId ?? "nothing"}
    </output>
  );
}
const probeText = () => document.querySelector("output")?.textContent ?? "";

// ---- the drawer on its own ------------------------------------------------------------------
function drawer(props: Partial<Parameters<typeof MakeChangesDrawer>[0]> = {}) {
  const handlers = { onClose: vi.fn(), onLeaveOut: vi.fn().mockResolvedValue(true), onRemoveExtra: vi.fn().mockResolvedValue(true), onMoveDay: vi.fn(), onChangeLocation: vi.fn(), loadDeliveryOptions: vi.fn().mockResolvedValue({ community: { feeKobo: 50_000 }, instant: { feeKobo: 150_000 } }) };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/subscriptions"]}>
        <PendingExtrasProvider>
          <MakeChangesDrawer box={box()} open busy={false} {...handlers} {...props} />
          <Probe />
        </PendingExtrasProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return handlers;
}

describe("the Make changes menu", () => {
  it("has three options with the delivery method above the date, and 'Add extra items' is not one of them (it is a button on the order)", async () => {
    drawer();
    const rows = (await screen.findAllByRole("button")).map((b) => b.textContent);
    expect(rows.slice(0, 3).map((t) => t?.replace(/\s+/g, " ").trim())).toEqual([
      "Remove an item",
      "Change delivery methodCommunity Delivery · 12 Soluyi Road",
      "Change delivery dateTue 24 Nov",
    ]);
    expect(screen.queryByRole("button", { name: /Add extra items/ })).toBeNull();
  });

  it("shows how and where the order goes under 'Change delivery method', so she can see the address can change too", async () => {
    drawer();
    const where = await screen.findByText("Community Delivery · 12 Soluyi Road");
    expect(where).toHaveClass("truncate");
  });

  it("for pick-up, names the station", async () => {
    drawer({ box: box({ delivery: { type: "pickup", zoneName: null, address: null, lat: null, lng: null, pickupStationId: "st1", pickupStationName: "Yaba station" } }) });
    expect(await screen.findByText("Pick-up · Yaba station")).toBeInTheDocument();
  });
});

describe("changing a pick-up order to delivery", () => {
  const pickupBox = () => box({ delivery: { type: "pickup", zoneName: null, address: null, lat: null, lng: null, pickupStationId: "st1", pickupStationName: "Yaba station" } });

  it("starts from her last delivery address, so Community Delivery is offered again", async () => {
    const { loadDeliveryOptions } = drawer({ box: pickupBox(), startOn: "location", lastAddress: { address: "3 Faramobi Ajike St", lat: 6.55, lng: 3.38 } });
    expect(await screen.findByRole("button", { name: /^Community Delivery · ₦500/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pick-up/ })).toHaveAttribute("aria-pressed", "true");
    expect(loadDeliveryOptions).toHaveBeenCalledWith(6.55, 3.38);
    fireEvent.click(screen.getByRole("button", { name: /^Community Delivery/ }));
    expect(screen.getByText("3 Faramobi Ajike St")).toBeInTheDocument();
    expect(screen.getByText("Your last delivery address")).toBeInTheDocument();
  });

  it("with no address ever used, it cannot know yet: Community Delivery comes once she enters one", async () => {
    const { loadDeliveryOptions } = drawer({ box: pickupBox(), startOn: "location" });
    expect(await screen.findByRole("button", { name: /^Instant Delivery/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Community Delivery/ })).toBeNull();
    expect(loadDeliveryOptions).not.toHaveBeenCalled();
  });
});

describe("removing things from the order", () => {
  const openRemove = async () => {
    fireEvent.click(await screen.findByRole("button", { name: /Remove an item/ }));
    return within(await screen.findByText("Choose what to take out of this order").then((el) => el.closest("[role=dialog]") as HTMLElement));
  };

  it("lists an extra, marked as extra, with its own Remove button", async () => {
    drawer();
    const sheet = await openRemove();
    expect(sheet.getByText("Nappy cream")).toBeInTheDocument();
    expect(sheet.getByText("100g · ×3 · extra")).toBeInTheDocument();
    expect(sheet.getByRole("button", { name: "Remove Nappy cream (extra)" })).toBeEnabled();
  });

  it("takes an extra out with removeExtra, not leaveOut", async () => {
    const h = drawer();
    const sheet = await openRemove();
    fireEvent.click(sheet.getByRole("button", { name: "Remove Nappy cream (extra)" }));
    expect(h.onRemoveExtra).toHaveBeenCalledWith("x1"); // the line's own id: an extra has no subscription
    expect(h.onLeaveOut).not.toHaveBeenCalled();
  });

  it("still takes a subscription item out with leaveOut, not removeExtra", async () => {
    const h = drawer();
    const sheet = await openRemove();
    fireEvent.click(sheet.getByRole("button", { name: "Remove Baby wipes" }));
    expect(h.onLeaveOut).toHaveBeenCalledWith("s2");
    expect(h.onRemoveExtra).not.toHaveBeenCalled();
  });

  it("an extra cannot be taken out while she is waiting on a change", async () => {
    drawer({ busy: true });
    const sheet = await openRemove();
    expect(sheet.getByRole("button", { name: "Remove Nappy cream (extra)" })).toBeDisabled();
    expect(sheet.getByRole("button", { name: "Remove Baby wipes" })).toBeDisabled();
  });

  it("extras do not count as the item an order needs: the last subscription item stays, the extra can go", async () => {
    const h = drawer({ box: box({ items: [line(), extra()] }) });
    const sheet = await openRemove();
    expect(sheet.getByRole("button", { name: "Remove Kisskids Diapers" })).toBeDisabled();
    expect(sheet.getByText(/An order needs at least one item/)).toBeInTheDocument();
    fireEvent.click(sheet.getByRole("button", { name: "Remove Nappy cream (extra)" }));
    expect(h.onRemoveExtra).toHaveBeenCalledWith("x1");
  });

  it("gives no reason to keep the order whole when it has two subscription items", async () => {
    drawer({ box: box({ items: [line(), line({ id: "l2", subscriptionId: "s2", productName: "Baby wipes" })] }) });
    const sheet = await openRemove();
    expect(sheet.getByRole("button", { name: "Remove Baby wipes" })).toBeEnabled();
    expect(sheet.queryByText(/An order needs at least one item/)).toBeNull();
  });
});

describe("the delivery method pills carry their price", () => {
  it("each pill says what that way costs once known; pick-up is free", async () => {
    drawer();
    fireEvent.click(await screen.findByRole("button", { name: /Change delivery method/ }));
    expect(await screen.findByRole("button", { name: "Community Delivery · ₦500" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Instant Delivery · ₦1,500" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pick-up · Free" })).toBeInTheDocument();
  });
});

describe("the address under the delivery method", () => {
  it("has 'Change address' right under it, as a small link (not a big dashed button), with no line between", async () => {
    drawer();
    fireEvent.click(await screen.findByRole("button", { name: /Change delivery method/ }));
    const change = await screen.findByRole("button", { name: "Change address" });
    const row = screen.getByText("12 Soluyi Road").closest("div")!;
    expect(row).toContainElement(change);
    expect(row.className).not.toMatch(/border-b/);
    expect(change.className).not.toMatch(/dashed/);
    expect(change).toHaveClass("underline");
  });
});

describe("changing the address, then changing her mind", () => {
  it("Cancel under the address search goes back to the address she had, with nothing changed", async () => {
    const h = drawer();
    fireEvent.click(await screen.findByRole("button", { name: /Change delivery method/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Change address" }));
    expect(screen.queryByText("12 Soluyi Road")).toBeNull();
    // Cancel sits on the "Enter Delivery Address" row.
    expect(within(screen.getByTestId("address-search")).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("12 Soluyi Road")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change address" })).toBeInTheDocument();
    expect(h.onChangeLocation).not.toHaveBeenCalled();
  });
});

describe("which days 'Change delivery date' offers, in words", () => {
  const openDates = async () => fireEvent.click(await screen.findByRole("button", { name: /Change delivery date/ }));

  it("Community Delivery: these are the area's days; for another day, switch to Instant first (and a link goes there)", async () => {
    drawer();
    await openDates();
    expect(await screen.findByText(/These are the next Community Delivery days for your area\. For a different day, change the delivery method to Instant Delivery first/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change delivery method" }));
    expect(await screen.findByText("How should this order reach you?")).toBeInTheDocument();
  });

  it("Instant Delivery: the next Instant days", async () => {
    drawer({ box: box({ delivery: { type: "instant", zoneName: null, address: "3 Faramobi Ajike St", lat: 6.56, lng: 3.37, pickupStationId: null, pickupStationName: null } }) });
    await openDates();
    expect(await screen.findByText("These are the next days we deliver by Instant Delivery. Pick one and save.")).toBeInTheDocument();
  });

  it("Pick-up: the station's next pick-up days", async () => {
    drawer({ box: box({ delivery: { type: "pickup", zoneName: null, address: null, lat: null, lng: null, pickupStationId: "st1", pickupStationName: "Yaba station" } }) });
    await openDates();
    expect(await screen.findByText("These are the next pick-up days at Yaba station. Pick one and save.")).toBeInTheDocument();
  });
});

// ---- on the tab -----------------------------------------------------------------------------
describe("on the Subscription tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.value = { session: { access_token: "tok" }, user: { id: "u1" }, walletBalance: 5000, signOut: vi.fn() };
    api.mine.mockResolvedValue(tab());
    api.leaveOut.mockResolvedValue({ ok: true });
    api.removeExtra.mockResolvedValue({ ok: true });
  });

  function showTab() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/subscriptions"]}>
          <PendingExtrasProvider>
            <SubscriptionTab />
            <Probe />
          </PendingExtrasProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("removes an extra from the order through the server, and reads the tab again", async () => {
    showTab();
    fireEvent.click(await screen.findByRole("button", { name: "Make changes" }));
    fireEvent.click(await screen.findByRole("button", { name: /Remove an item/ }));
    const before = api.mine.mock.calls.length;
    fireEvent.click(await screen.findByRole("button", { name: "Remove Nappy cream (extra)" }));
    await waitFor(() => expect(api.removeExtra).toHaveBeenCalledWith("tok", "b1", "x1"));
    await waitFor(() => expect(api.mine.mock.calls.length).toBeGreaterThan(before));
    expect(api.leaveOut).not.toHaveBeenCalled();
  });

  it("removes a subscription item the way it always did", async () => {
    showTab();
    fireEvent.click(await screen.findByRole("button", { name: "Make changes" }));
    fireEvent.click(await screen.findByRole("button", { name: /Remove an item/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove Baby wipes" }));
    await waitFor(() => expect(api.leaveOut).toHaveBeenCalledWith("tok", "b1", "s2"));
    expect(api.removeExtra).not.toHaveBeenCalled();
  });

  it("'Add extra items' on the order takes her to the shop to pick for this order", async () => {
    showTab();
    fireEvent.click(await screen.findByRole("button", { name: "Add extra items" }));
    expect(probeText()).toContain("at:/shop");
    expect(probeText()).toContain("for:b1");
  });

  it("starts shopping for the order the button is on, not another one", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ id: "b2", deliveryDate: "2026-12-08" })] }));
    showTab();
    fireEvent.click(await screen.findByRole("button", { name: "Add extra items" }));
    expect(probeText()).toContain("for:b2");
  });

  it("is not there for an order she can no longer change", async () => {
    api.mine.mockResolvedValue(tab({ boxes: [box({ editable: false, status: "paid" })] }));
    showTab();
    await screen.findByText("Paid.");
    expect(screen.queryByRole("button", { name: "Add extra items" })).toBeNull();
  });
});
