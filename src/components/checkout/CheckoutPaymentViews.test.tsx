import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutPaymentView } from "./CheckoutPaymentView";
import { DesktopCheckoutPaymentView } from "./DesktopCheckoutPaymentView";

/**
 * When the wallet and/or a gift card cover the whole order there is no bank transfer to wait
 * for, so "Place order" must tell the server the order is paid (markPaymentMade: it debits the
 * wallet, redeems the gift card and confirms the order) before moving on. The web view used to
 * skip that call, which left the order at "Order submitted" with the wallet untouched.
 *
 * An order whose remaining total is ₦0 puts both views in that state without having to drive
 * the wallet pop-over.
 */

const mocks = vi.hoisted(() => ({
  markPaymentMade: vi.fn(),
  refreshWalletBalance: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: { markPaymentMade: (...args: unknown[]) => mocks.markPaymentMade(...args) },
    getWalletSummary: vi.fn().mockResolvedValue({ balance: 0 }),
  };
});
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: { access_token: "tok" },
    refreshWalletBalance: mocks.refreshWalletBalance,
  }),
}));
vi.mock("@/lib/metaPixel", () => ({ metaPixel: { purchase: vi.fn() } }));

const ORDER = "NST-1";

interface Callbacks {
  onPaymentConfirmed: () => void;
  onGiftCardFullCoverage?: () => void;
  onBack: () => void;
}

const views: Array<{
  name: string;
  show: (props: Callbacks, totalAmount: number) => ReactElement;
}> = [
  {
    name: "mobile payment view",
    show: (props, totalAmount) => (
      <CheckoutPaymentView orderId={ORDER} totalAmount={totalAmount} token="tok" {...props} />
    ),
  },
  {
    name: "web payment view",
    show: (props, totalAmount) => (
      <DesktopCheckoutPaymentView orderId={ORDER} totalAmount={totalAmount} {...props} />
    ),
  },
];

const mount = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const placeOrder = () => screen.getByRole("button", { name: /place order/i });

beforeEach(() => {
  mocks.markPaymentMade.mockReset().mockResolvedValue({ status: "processing" });
  mocks.refreshWalletBalance.mockReset().mockResolvedValue(undefined);
});

describe.each(views)("$name, order covered in full", ({ show }) => {
  const callbacks = () => ({
    onPaymentConfirmed: vi.fn(),
    onGiftCardFullCoverage: vi.fn(),
    onBack: vi.fn(),
  });

  it("tells the server the order is paid, then moves on, and refreshes the wallet", async () => {
    const cb = callbacks();
    mount(show(cb, 0));

    fireEvent.click(placeOrder());

    await waitFor(() => expect(cb.onGiftCardFullCoverage).toHaveBeenCalledTimes(1));
    expect(mocks.markPaymentMade).toHaveBeenCalledTimes(1);
    expect(mocks.markPaymentMade).toHaveBeenCalledWith(ORDER, "tok");
    expect(mocks.refreshWalletBalance).toHaveBeenCalled(); // the wallet was just debited
    expect(cb.onPaymentConfirmed).not.toHaveBeenCalled();
  });

  it("does not move on before the server has answered", async () => {
    let answer!: (value: unknown) => void;
    mocks.markPaymentMade.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const cb = callbacks();
    mount(show(cb, 0));

    fireEvent.click(placeOrder());

    await waitFor(() => expect(mocks.markPaymentMade).toHaveBeenCalled());
    expect(cb.onGiftCardFullCoverage).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /placing order/i })).toBeDisabled();

    answer({ status: "processing" });
    await waitFor(() => expect(cb.onGiftCardFullCoverage).toHaveBeenCalledTimes(1));
  });

  it("uses the normal onPaymentConfirmed when the caller has no full-coverage handler (Account, gifting)", async () => {
    const { onGiftCardFullCoverage: _unused, ...cb } = callbacks();
    void _unused;
    mount(show(cb, 0));

    fireEvent.click(placeOrder());

    await waitFor(() => expect(cb.onPaymentConfirmed).toHaveBeenCalledTimes(1));
    expect(mocks.markPaymentMade).toHaveBeenCalledWith(ORDER, "tok");
  });

  it("stays put and says why when the server refuses, so the buyer can try again", async () => {
    mocks.markPaymentMade.mockRejectedValue(new Error("Gift card has expired"));
    const cb = callbacks();
    mount(show(cb, 0));

    fireEvent.click(placeOrder());

    expect(await screen.findByText("Gift card has expired")).toBeInTheDocument();
    expect(cb.onGiftCardFullCoverage).not.toHaveBeenCalled();
    expect(cb.onPaymentConfirmed).not.toHaveBeenCalled();
    expect(placeOrder()).toBeEnabled();
  });

  it("still moves on when only the wallet refresh fails (the order is already placed)", async () => {
    mocks.refreshWalletBalance.mockRejectedValue(new Error("network"));
    const cb = callbacks();
    mount(show(cb, 0));

    fireEvent.click(placeOrder());

    await waitFor(() => expect(cb.onGiftCardFullCoverage).toHaveBeenCalledTimes(1));
  });
});

describe.each(views)("$name, order not covered (bank transfer)", ({ show }) => {
  it("'Payment made' still reports the payment and waits for confirmation, not the full-coverage path", async () => {
    const cb = { onPaymentConfirmed: vi.fn(), onGiftCardFullCoverage: vi.fn(), onBack: vi.fn() };
    mount(show(cb, 500_000));

    expect(screen.queryByRole("button", { name: /place order/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /payment made/i }));

    await waitFor(() => expect(cb.onPaymentConfirmed).toHaveBeenCalledTimes(1));
    expect(mocks.markPaymentMade).toHaveBeenCalledWith(ORDER, "tok");
    expect(cb.onGiftCardFullCoverage).not.toHaveBeenCalled();
  });
});
