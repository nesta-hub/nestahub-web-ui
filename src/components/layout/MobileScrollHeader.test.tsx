import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MobileScrollHeader } from "./MobileScrollHeader";

const show = () =>
  render(
    <MemoryRouter initialEntries={["/share"]}>
      <MobileScrollHeader alwaysVisible />
    </MemoryRouter>,
  );

describe("the phone's top bar on the referral and share pages", () => {
  it("has the shared menu, the logo and the cart", () => {
    show();

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nesta Hub" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");
  });

  it("takes the logo to the shop, as there is no home page", () => {
    show();

    expect(screen.getByRole("link", { name: "Nesta Hub" })).toHaveAttribute("href", "/shop");
  });

  it("opens the same menu as the shop's", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("link", { name: "Mum Tools" })).toBeInTheDocument();
  });
});
