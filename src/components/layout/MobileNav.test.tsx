import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MobileNav } from "./MobileNav";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));

const show = (address: string, user: { name: string } | null = null) => {
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={[address]}>
      <MobileNav />
    </MemoryRouter>,
  );
};

const link = (name: string) => screen.getByRole("link", { name: new RegExp(name) });
const active = (name: string) => link(name).className.includes("text-primary");

describe("the phone's bottom navigation", () => {
  it("has Shop, Gifting, Mum Tools, Contact and Account, in that order", () => {
    show("/shop");

    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Gifting", "Mum Tools", "Contact", "Account"]);
  });

  it("has no Home: there is no home page", () => {
    show("/shop");

    expect(screen.queryByRole("link", { name: /Home/ })).toBeNull();
  });

  it("goes where it says", () => {
    show("/shop");

    expect(link("Shop")).toHaveAttribute("href", "/shop");
    expect(link("Gifting")).toHaveAttribute("href", "/gifting");
    expect(link("Mum Tools")).toHaveAttribute("href", "/mum-tools");
    expect(link("Contact")).toHaveAttribute("href", "/contact");
    expect(link("Account")).toHaveAttribute("href", "/account");
  });

  it.each(["/shop", "/shop/baby-care", "/shop/baby-care/body-wash", "/catalogue", "/catalogue/some-product"])("marks Shop at %s", (path) => {
    show(path);

    expect(active("Shop")).toBe(true);
    expect(active("Gifting")).toBe(false);
  });

  it("marks Mum Tools on its page, and only there", () => {
    show("/mum-tools");

    expect(active("Mum Tools")).toBe(true);
    expect(active("Shop")).toBe(false);
  });

  it("marks Gifting inside the gifting pages", () => {
    show("/gifting/cards");

    expect(active("Gifting")).toBe(true);
  });

  it("shows the shopper's initials for Account when signed in", () => {
    show("/shop", { name: "Ama Mensah" });

    expect(link("Account")).toHaveTextContent("AM");
  });

  it("keeps every label on one line so five fit across a phone", () => {
    show("/shop");

    for (const a of screen.getAllByRole("link")) expect(a).toHaveClass("whitespace-nowrap");
  });
});
