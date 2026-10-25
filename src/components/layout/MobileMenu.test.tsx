import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MobileMenu } from "./MobileMenu";

const show = (address = "/shop") =>
  render(
    <MemoryRouter initialEntries={[address]}>
      <MobileMenu />
    </MemoryRouter>,
  );

const open = () => fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
const menu = () => within(screen.getByRole("navigation", { name: "Menu" }));

describe("the phone's menu", () => {
  it("is a button, with nothing open until it is pressed", () => {
    show();

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
  });

  it("opens with the site's links: Shop, Gifting, Mum Tools, Share, Contact", () => {
    show();
    open();

    expect(menu().getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Gifting", "Mum Tools", "Share", "Contact"]);
    expect(menu().getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/shop");
    expect(menu().getByRole("link", { name: "Mum Tools" })).toHaveAttribute("href", "/mum-tools");
  });

  it("has no Home: there is no home page", () => {
    show();
    open();

    expect(menu().queryByRole("link", { name: "Home" })).toBeNull();
  });

  it("shows the logo", () => {
    show();
    open();

    expect(screen.getByRole("img", { name: "Nesta Hub" })).toBeInTheDocument();
  });

  it.each([
    ["/shop", "Shop"],
    ["/shop/baby-care", "Shop"],
    ["/catalogue/some-product", "Shop"],
    ["/mum-tools", "Mum Tools"],
    ["/gifting", "Gifting"],
  ])("marks the page you are on at %s", (path, label) => {
    show(path);
    open();

    expect(menu().getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(menu().getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("closes when a link is chosen", () => {
    show();
    open();

    fireEvent.click(menu().getByRole("link", { name: "Gifting" }));

    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
  });
});
