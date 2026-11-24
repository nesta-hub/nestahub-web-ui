import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { giftCardThemes } from "@/components/gifting/GiftCardThemes";
import type { ConfiguredGiftCard } from "@/pages/GiftCardDetailsV2";
import { DesktopGiftCardStudio } from "./DesktopGiftCardStudio";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ session: null }) }));
vi.mock("@/hooks/useOrderConfirmationPoll", () => ({ useOrderConfirmationPoll: () => ({ state: "idle", status: null }) }));
// Payment and sign-in come after the review, which is what is under test.
vi.mock("@/components/checkout/DesktopCheckoutPaymentView", () => ({ DesktopCheckoutPaymentView: () => null }));
vi.mock("@/components/checkout/DesktopCheckoutSuccessView", () => ({ DesktopCheckoutSuccessView: () => null }));
vi.mock("@/components/checkout/CheckoutSignIn", () => ({ CheckoutSignIn: () => null }));

const card = (id: string, over: Partial<ConfiguredGiftCard> = {}): ConfiguredGiftCard => ({
  id,
  theme: giftCardThemes[0],
  amount: 1_000_000,
  deliveryMethod: "link",
  recipientName: `Recipient ${id}`,
  recipientPhone: "",
  ...over,
});

/** The studio with these cards already added, taken to the review. */
function review(...cards: ConfiguredGiftCard[]) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/gifting/cards", state: { addedCards: cards } }]}>
      <DesktopGiftCardStudio />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Review gift cards" }));
}

beforeEach(() => localStorage.clear());

describe("reviewing gift cards on desktop", () => {
  it("shows the card", () => {
    review(card("a"));

    expect(screen.getByRole("heading", { level: 1, name: "Review your order" })).toBeInTheDocument();
    expect(screen.getByText("Gift card")).toBeInTheDocument();
    expect(screen.getAllByText("Recipient a").length).toBeGreaterThan(0);
  });

  it("says cards when there is more than one", () => {
    review(card("a"), card("b", { deliveryMethod: "whatsapp", recipientPhone: "08012345678" }));

    expect(screen.getByText("Gift cards")).toBeInTheDocument();
    expect(screen.getByText("08012345678")).toBeInTheDocument();
  });
});
