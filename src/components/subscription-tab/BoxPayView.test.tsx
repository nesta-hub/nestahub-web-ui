import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Box } from "@/lib/subscriptionBoxes";
import { BoxPayView } from "./BoxPayView";

const api = vi.hoisted(() => ({
  markPaymentMade: vi.fn(),
  applyWalletToOrder: vi.fn(),
  removeWalletFromOrder: vi.fn(),
  applyGiftCardToOrder: vi.fn(),
  removeGiftCardFromOrder: vi.fn(),
}));
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  api: { markPaymentMade: api.markPaymentMade },
  applyWalletToOrder: api.applyWalletToOrder,
  removeWalletFromOrder: api.removeWalletFromOrder,
  applyGiftCardToOrder: api.applyGiftCardToOrder,
  removeGiftCardFromOrder: api.removeGiftCardFromOrder,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ refreshWalletBalance: vi.fn().mockResolvedValue(undefined) }) }));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { purchase: vi.fn() } }));
vi.mock("@/components/checkout/ApplyCreditsDrawer", () => ({
  ApplyCreditsDrawer: ({ open, onApplyGiftCard }: { open: boolean; onApplyGiftCard: (code: string, balance: number, amount: number) => Promise<void> }) =>
    open ? (
      <button type="button" onClick={() => void onApplyGiftCard("GIFT1", 2_000_000, 1_190_000)}>
        redeem gift card
      </button>
    ) : null,
}));

const box = (over: Partial<Box> = {}): Box =>
  ({
    id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
    delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
    needsDelivery: false, items: [], subtotalKobo: 1_140_000, deliveryFeeKobo: 50_000, totalKobo: 1_190_000, order: null, canPay: true, canUndoSkip: false, openDays: [],
    ...over,
  }) as Box;

function show(props: Partial<Parameters<typeof BoxPayView>[0]> = {}) {
  const handlers = { onBack: vi.fn(), onDone: vi.fn() };
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BoxPayView box={box()} orderNumber="NSTABC123" totalKobo={1_190_000} token="tok" walletBalance={500_000} allowGiftCard {...handlers} {...props} />
    </QueryClientProvider>,
  );
  return handlers;
}
const amount = () => within(screen.getByRole("region", { name: "Amount to pay" }));

beforeEach(() => {
  vi.clearAllMocks();
  api.markPaymentMade.mockResolvedValue({});
  api.applyWalletToOrder.mockImplementation(async (_o: string, amountKobo: number) => ({ amountApplied: amountKobo }));
  api.removeWalletFromOrder.mockResolvedValue({});
  api.applyGiftCardToOrder.mockResolvedValue({ code: "GIFT1", balance: 2_000_000 });
});

describe("Complete payment (D2)", () => {
  it("shows the order ID to put in the narration, the amount, and our bank details", () => {
    show();
    expect(screen.getByRole("heading", { name: "Complete payment" })).toBeInTheDocument();
    expect(screen.getByText("NSTABC123")).toBeInTheDocument();
    expect(screen.getByText("Include this Order ID in the transfer narration")).toBeInTheDocument();
    expect(amount().getByText("₦11,900")).toBeInTheDocument();
    expect(screen.getByText("Bank transfer details")).toBeInTheDocument();
    expect(screen.getByText("Moniepoint MFB")).toBeInTheDocument();
    expect(screen.getByText("4005050638")).toBeInTheDocument();
    expect(screen.getByText("Nesta Hub")).toBeInTheDocument();
    expect(screen.getByText('Tap "Payment made" once your transfer is complete.')).toBeInTheDocument();
  });

  it("'Payment made' is the Nesta Hub brown", () => {
    show();
    expect(screen.getByRole("button", { name: "Payment made" })).toHaveClass("bg-shop-cta");
  });

  it("copies the amount in naira, ready to paste into a bank app", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy amount" }));
    expect(writeText).toHaveBeenCalledWith("11900");
    fireEvent.click(screen.getByRole("button", { name: "Copy account number" }));
    expect(writeText).toHaveBeenCalledWith("4005050638");
  });

  it("Back goes back to the tab without paying", () => {
    const h = show();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(h.onBack).toHaveBeenCalled();
    expect(api.markPaymentMade).not.toHaveBeenCalled();
  });
});

describe("wallet credit", () => {
  it("offers her wallet balance, applies as much as the order needs in one tap, and takes it off the amount", async () => {
    show();
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    expect(api.applyWalletToOrder).toHaveBeenCalledWith("NSTABC123", 500_000, "tok");
    expect(await amount().findByText("Wallet credit applied: −₦5,000")).toBeInTheDocument();
    expect(amount().getByText("₦6,900")).toBeInTheDocument();
  });

  it("can be taken off again", async () => {
    show();
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    fireEvent.click(await amount().findByRole("button", { name: "Remove wallet credit" }));
    await waitFor(() => expect(amount().getByText("₦11,900")).toBeInTheDocument());
    expect(api.removeWalletFromOrder).toHaveBeenCalledWith("NSTABC123", "tok");
  });

  it("is not offered when she has none (and never to someone who opened a link)", () => {
    show({ walletBalance: 0, token: "", allowGiftCard: false });
    expect(screen.queryByRole("button", { name: /Apply wallet credit/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Use a gift card" })).toBeNull();
  });

  it("says why when the wallet could not be applied", async () => {
    api.applyWalletToOrder.mockRejectedValue(new Error("Your wallet balance has changed."));
    show();
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    expect(await screen.findByText("Your wallet balance has changed.")).toBeInTheDocument();
  });
});

describe("the wallet covers it all (D3)", () => {
  it("says no transfer is needed, hides the bank details, and the button places the order", async () => {
    show({ walletBalance: 3_000_000 });
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    expect(api.applyWalletToOrder).toHaveBeenCalledWith("NSTABC123", 1_190_000, "tok");
    expect(await screen.findByText("Your wallet credit covers the full order.")).toBeInTheDocument();
    expect(screen.queryByText("Bank transfer details")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy amount" })).toBeNull();
    expect(screen.queryByText(/once your transfer is complete/)).toBeNull();
    expect(screen.getByRole("button", { name: "Place order" })).toBeInTheDocument();
  });
});

describe("after the button (D4)", () => {
  it("transfer: tells us to look for it, then says we are matching it, with the order and the delivery", async () => {
    const h = show();
    fireEvent.click(screen.getByRole("button", { name: "Payment made" }));
    expect(await screen.findByRole("heading", { name: "Payment marked" })).toBeInTheDocument();
    expect(api.markPaymentMade).toHaveBeenCalledWith("NSTABC123", "tok");
    expect(screen.getByText("We are matching your transfer of ₦11,900. We will start preparing your order as soon as it is confirmed.")).toBeInTheDocument();
    expect(screen.getByText("Tue 24 Nov · 12 Soluyi Road")).toBeInTheDocument();
    expect(screen.getByText("Bank transfer")).toBeInTheDocument();
    expect(screen.queryByText("Paid from wallet")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to Subscription" }));
    expect(h.onDone).toHaveBeenCalled();
  });

  it("part wallet, part transfer: shows both", async () => {
    show();
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    await amount().findByText("Wallet credit applied: −₦5,000");
    fireEvent.click(screen.getByRole("button", { name: "Payment made" }));
    await screen.findByRole("heading", { name: "Payment marked" });
    expect(screen.getByText("Paid from wallet")).toBeInTheDocument();
    expect(screen.getByText("We are matching your transfer of ₦6,900. We will start preparing your order as soon as it is confirmed.")).toBeInTheDocument();
  });

  it("wallet covered it: the order is paid and goes out on its day", async () => {
    show({ walletBalance: 3_000_000 });
    fireEvent.click(amount().getByRole("button", { name: /Apply wallet credit/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Place order" }));
    expect(await screen.findByRole("heading", { name: "Order paid" })).toBeInTheDocument();
    expect(screen.getByText("Your wallet covered ₦11,900. Your order goes out Tue 24 Nov.")).toBeInTheDocument();
    expect(screen.queryByText("Bank transfer")).toBeNull();
  });

  it("a pick-up order shows the station", async () => {
    show({ box: box({ delivery: { type: "pickup", zoneName: null, address: null, lat: null, lng: null, pickupStationId: "st1", pickupStationName: "Yaba station" } as Box["delivery"] }) });
    fireEvent.click(screen.getByRole("button", { name: "Payment made" }));
    expect(await screen.findByText("Tue 24 Nov · Pick-up: Yaba station")).toBeInTheDocument();
  });

  it("when the server says no, she stays on the pay screen and is told why", async () => {
    api.markPaymentMade.mockRejectedValue(new Error("This order has been cancelled."));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Payment made" }));
    expect(await screen.findByText("This order has been cancelled.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Payment marked" })).toBeNull();
  });
});

describe("gift cards (signed in only)", () => {
  it("can still be used, as on every pay screen", async () => {
    show({ walletBalance: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Use a gift card" }));
    fireEvent.click(screen.getByRole("button", { name: "redeem gift card" }));
    expect(await screen.findByText("Your gift card covers the full order.")).toBeInTheDocument();
    expect(api.applyGiftCardToOrder).toHaveBeenCalledWith("NSTABC123", "GIFT1", "tok");
  });
});
