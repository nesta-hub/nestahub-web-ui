import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignedInWelcome, WelcomeCard } from "./WelcomeCard";
import { MOBILE_OFFERS } from "./offers";

/**
 * The signed-in first card is the Nesta Hub advert (its blue and baby photo), with the pill saying
 * "WELCOME BACK, <NAME>", the wallet and its balance in big letters where the title was, no line of
 * small text, and a "Shop now" button.
 */

const mocks = vi.hoisted(() => ({
  session: null as null | { access_token: string; user?: { user_metadata?: Record<string, string> } },
  user: null as null | { name?: string },
  getWalletSummary: vi.fn(),
  getMyOrders: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ session: mocks.session, user: mocks.user }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getWalletSummary: (...args: unknown[]) => mocks.getWalletSummary(...args),
  getMyOrders: (...args: unknown[]) => mocks.getMyOrders(...args),
}));

function Where() {
  const l = useLocation();
  return <output aria-label="where">{`${l.pathname}|${JSON.stringify(l.state)}`}</output>;
}
const where = () => screen.getByLabelText("where").textContent;

const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      {ui}
      <Where />
    </MemoryRouter>
  </QueryClientProvider>
);

describe("the signed-in first card", () => {
  const show = (over: Partial<React.ComponentProps<typeof WelcomeCard>> = {}) => {
    const props = { name: "Sade", balanceKobo: 1_006_000, onOpenWallet: vi.fn(), onShop: vi.fn(), ...over };
    const view = render(wrap(<WelcomeCard {...props} />));
    return { ...props, ...view };
  };

  it("puts the customer's name on the pill, where 'NESTA HUB' was", () => {
    show();

    expect(screen.getByText("WELCOME BACK, SADE")).toBeInTheDocument();
    expect(screen.queryByText("NESTA HUB")).toBeNull();
  });

  it("says just 'WELCOME BACK' for someone with no name on record", () => {
    show({ name: null });

    expect(screen.getByText("WELCOME BACK")).toBeInTheDocument();
  });

  it("keeps a long name on one line, cut short, so the pill never wraps", () => {
    show({ name: "Oluwaseyifunmilayo" });

    expect(screen.getByText("WELCOME BACK, OLUWASEYIFUNMILAYO")).toHaveClass("truncate", "max-w-full");
  });

  it("shows the wallet and its balance where 'Everything for baby and mum' was", () => {
    show();

    expect(screen.getByText("Wallet")).toBeInTheDocument();
    expect(screen.getByText("₦10,060")).toBeInTheDocument();
    expect(screen.queryByText(MOBILE_OFFERS[0].title)).toBeNull();
  });

  it("puts the balance below the word Wallet, and bigger than it", () => {
    show();
    const wallet = screen.getByText("Wallet");
    const balance = screen.getByText("₦10,060");

    expect(wallet.compareDocumentPosition(balance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(wallet).toHaveClass("text-xs", "font-extrabold"); // 12px
    expect(balance).toHaveClass("text-2xl", "font-extrabold"); // 24px
  });

  it("leaves room between the pill and the word Wallet", () => {
    show();

    // 6px between every line of text, and 8px more above the wallet: 14px under the pill.
    expect(screen.getByRole("button", { name: "Open wallet, balance ₦10,060" })).toHaveClass("mt-2");
  });

  it("steps a very large balance down a size, so it can't run under the photo", () => {
    show({ balanceKobo: 1_250_000_000 }); // ₦12,500,000

    expect(screen.getByText("₦12,500,000")).toHaveClass("text-xl"); // 20px, one step below the usual 24px
  });

  it("has no line of small text, and keeps the baby photo", () => {
    const { container } = show();

    expect(screen.queryByText(MOBILE_OFFERS[0].sub)).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("has a 'Shop now' button, which shops", () => {
    const { onShop } = show();

    fireEvent.click(screen.getByRole("button", { name: "Shop now" }));

    expect(onShop).toHaveBeenCalledTimes(1);
  });

  it("opens the wallet when the wallet and balance are tapped", () => {
    const { onOpenWallet } = show();

    fireEvent.click(screen.getByRole("button", { name: "Open wallet, balance ₦10,060" }));

    expect(onOpenWallet).toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder, not ₦0, until the balance has loaded", () => {
    show({ balanceKobo: null });

    expect(screen.queryByText(/₦/)).toBeNull();
    expect(screen.getByRole("button", { name: "Open wallet" })).toHaveTextContent("Wallet");
  });

  it("has two buttons and nothing else to tap: the wallet and Shop now", () => {
    show();

    expect(screen.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Wallet₦10,060", "Shop now"]);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("the first card for the signed-in customer", () => {
  beforeEach(() => {
    mocks.session = { access_token: "tok" };
    mocks.user = { name: "Sade Adeyemi" };
    mocks.getWalletSummary.mockReset().mockResolvedValue({ balance: 1_006_000 });
    mocks.getMyOrders.mockReset().mockResolvedValue({ orders: [] });
  });

  const show = (onShop = vi.fn()) => {
    render(wrap(<SignedInWelcome onShop={onShop} />));
    return { onShop };
  };

  it("greets by first name and shows their wallet balance", async () => {
    show();

    expect(screen.getByText("WELCOME BACK, SADE")).toBeInTheDocument();
    expect(await screen.findByText("₦10,060")).toBeInTheDocument();
    expect(mocks.getWalletSummary).toHaveBeenCalledWith("tok");
  });

  it("falls back to the name on the sign-in when the account has none", () => {
    mocks.user = null;
    mocks.session = { access_token: "tok", user: { user_metadata: { full_name: "Ada Obi" } } };
    show();

    expect(screen.getByText("WELCOME BACK, ADA")).toBeInTheDocument();
  });

  it("opens the wallet page when the wallet is tapped", async () => {
    show();

    fireEvent.click(await screen.findByRole("button", { name: /Open wallet, balance/ }));

    expect(where()).toBe("/account/wallet|null");
  });

  it("passes 'Shop now' on to the shop", () => {
    const { onShop } = show();

    fireEvent.click(screen.getByRole("button", { name: "Shop now" }));

    expect(onShop).toHaveBeenCalledTimes(1);
  });

  it("asks for nothing but the wallet: the orders are not loaded for this card", async () => {
    show();
    await screen.findByText("₦10,060");

    expect(mocks.getMyOrders).not.toHaveBeenCalled();
  });
});
