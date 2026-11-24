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
vi.mock("@/components/checkout/CheckoutAddressSection", () => ({ CheckoutAddressSection: () => <div /> }));
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
    expect(rows.slice(0, 3).map((t) => t?.replace(/\s+/g, " ").trim())).toEqual(["Remove an item", "Change delivery methodCommunity Delivery", "Change delivery dateTue 24 Nov"]);
    expect(screen.queryByRole("button", { name: /Add extra items/ })).toBeNull();
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
