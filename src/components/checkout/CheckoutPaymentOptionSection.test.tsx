import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPaymentOptionSection } from "./CheckoutPaymentOptionSection";

const show = (selectedOption: "pay-now" | "pay-on-delivery" | null, onSelectOption = vi.fn()) =>
  render(
    <CheckoutPaymentOptionSection
      selectedOption={selectedOption}
      onSelectOption={onSelectOption}
      onChangeOption={vi.fn()}
    />,
  );

describe("the payment option cards", () => {
  it("tell the buyer that Pay Now takes a bank transfer, the wallet or a gift card", () => {
    show(null);

    expect(screen.getByText("Bank Transfer, Wallet or Gift Card")).toBeInTheDocument();
    // not just "Bank transfer", which hides that the wallet and gift cards are paid here too
    expect(screen.queryByText("Bank transfer")).toBeNull();
  });

  it("picks Pay Now from its card", () => {
    const onSelectOption = vi.fn();
    show(null, onSelectOption);

    fireEvent.click(screen.getByText("Pay Now"));

    expect(onSelectOption).toHaveBeenCalledWith("pay-now");
  });

  it("keeps saying so once Pay Now is chosen", () => {
    show("pay-now");

    expect(screen.getByText("Pay Now")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer, Wallet or Gift Card")).toBeInTheDocument();
    expect(screen.queryByText(/on the next screen/)).toBeNull();
  });

  it("describes Pay on Delivery as paying the rider once chosen", () => {
    show("pay-on-delivery");

    expect(screen.getByText("Make payment on rider arrival")).toBeInTheDocument();
    expect(screen.queryByText("Bank Transfer, Wallet or Gift Card")).toBeNull();
  });
});
