import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MyOrder } from "@/lib/api";
import { OrdersView } from "./OrdersView";

/**
 * The shop's welcome card has a "Pay ₦12,400" chip. It sends the customer here with the order
 * named and asks for its payment screen, so they land on paying and not on a list to hunt through.
 */

const mocks = vi.hoisted(() => ({ getMyOrders: vi.fn() }));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ session: { access_token: "tok" } }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getMyOrders: (...args: unknown[]) => mocks.getMyOrders(...args),
}));
// The payment screen has its own tests; here it only has to say which order it is for.
vi.mock("@/components/checkout/CheckoutPaymentView", () => ({
  CheckoutPaymentView: ({ orderId, onBack, onPaymentConfirmed }: { orderId: string; onBack: () => void; onPaymentConfirmed: () => void }) => (
    <div>
      <p>{`paying:${orderId}`}</p>
      <button type="button" onClick={onBack}>
        leave payment
      </button>
      <button type="button" onClick={onPaymentConfirmed}>
        finish payment
      </button>
    </div>
  ),
}));

const order = (over: Partial<MyOrder> = {}): MyOrder => ({
  orderNumber: "NSTPAY001",
  status: "order_submitted",
  orderType: "shop",
  totalAmount: 1_240_000,
  createdAt: "2026-10-30T10:00:00Z",
  deliveryMethod: "address",
  deliveryFee: null,
  deliveryType: null,
  deliveryZoneName: null,
  scheduledDeliveryDate: null,
  fullName: "Sade",
  deliveryAddress: null,
  pickupStationName: null,
  pickupStationAddress: null,
  items: [],
  canCancel: false,
  canConfirmPayment: true,
  paymentOption: null,
  ...over,
});

const show = (props: { initialOrderNumber?: string; initialPay?: boolean } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <OrdersView onBack={vi.fn()} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  mocks.getMyOrders.mockReset().mockResolvedValue({ orders: [order(), order({ orderNumber: "NSTOTHER02" })] });
});

describe("opening an order's payment from the shop", () => {
  it("goes straight to that order's payment once the orders have loaded", async () => {
    show({ initialOrderNumber: "NSTPAY001", initialPay: true });

    expect(await screen.findByText("paying:NSTPAY001")).toBeInTheDocument();
  });

  it("shows the list, with the order open, when payment wasn't asked for", async () => {
    show({ initialOrderNumber: "NSTPAY001" });

    expect(await screen.findByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.queryByText(/paying:/)).toBeNull();
  });

  it("shows the list when that order can no longer be paid", async () => {
    mocks.getMyOrders.mockResolvedValue({ orders: [order({ canConfirmPayment: false, status: "processing" })] });
    show({ initialOrderNumber: "NSTPAY001", initialPay: true });

    expect(await screen.findByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.queryByText(/paying:/)).toBeNull();
  });

  it("shows the list when the order isn't there", async () => {
    show({ initialOrderNumber: "NSTGONE999", initialPay: true });

    expect(await screen.findByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.queryByText(/paying:/)).toBeNull();
  });

  it("goes back to the list when the customer leaves the payment, and does not open it again", async () => {
    show({ initialOrderNumber: "NSTPAY001", initialPay: true });
    fireEvent.click(await screen.findByRole("button", { name: "leave payment" }));

    expect(await screen.findByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.queryByText(/paying:/)).toBeNull();
  });

  it("goes back to the list after paying, and does not open it again", async () => {
    show({ initialOrderNumber: "NSTPAY001", initialPay: true });
    fireEvent.click(await screen.findByRole("button", { name: "finish payment" }));

    expect(await screen.findByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.queryByText(/paying:/)).toBeNull();
  });
});
