import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileMenu } from "./MobileMenu";

// The one switch for the new Subscribe experience. Off unless a test turns it on.
const subscribeOn = vi.fn(() => false);
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => subscribeOn() }));
beforeEach(() => subscribeOn.mockReturnValue(false));

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

describe("the phone's menu with the new Subscribe experience on", () => {
  beforeEach(() => subscribeOn.mockReturnValue(true));

  it("lists Shop, Subscribe, Gifting, Share and Contact, with no Mum Tools", () => {
    show();
    open();

    expect(menu().getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Subscribe", "Gifting", "Share", "Contact"]);
    expect(menu().getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/subscriptions");
    expect(menu().queryByRole("link", { name: "Mum Tools" })).toBeNull();
  });

  it("marks Subscribe on the tab and on its link pages", () => {
    for (const path of ["/subscriptions", "/subscriptions/pay/a-token"]) {
      const { unmount } = show(path);
      open();
      expect(menu().getByRole("link", { name: "Subscribe" })).toHaveAttribute("aria-current", "page");
      unmount();
    }
  });
});
