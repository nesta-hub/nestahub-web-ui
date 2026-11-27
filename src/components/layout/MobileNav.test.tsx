import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingExtrasProvider, usePendingExtras } from "@/contexts/PendingExtrasContext";
import { MobileNav } from "./MobileNav";
import { useLayoutEffect } from "react";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));

// The one switch for the new Subscribe experience. Off unless a test turns it on.
const subscribeOn = vi.fn(() => false);
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => subscribeOn() }));
beforeEach(() => subscribeOn.mockReturnValue(false));

const show = (address: string, user: { name: string } | null = null) => {
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={[address]}>
      <MobileNav />
    </MemoryRouter>,
  );
};

const link = (name: string) => screen.getByRole("link", { name: new RegExp(name) });
// The old nav marks where she is with `text-primary`; the Subscribe design's nav with its own brown.
const active = (name: string) => /\btext-(primary|shop-brown)\b/.test(link(name).className);

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

describe("the phone's bottom navigation with the new Subscribe experience on", () => {
  beforeEach(() => subscribeOn.mockReturnValue(true));

  it("has Shop, Subscribe, Gifting, Contact and Account, in that order, and no Mum Tools", () => {
    show("/shop");

    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Subscribe", "Gifting", "Contact", "Account"]);
    expect(screen.queryByRole("link", { name: /Mum Tools/ })).toBeNull();
  });

  it("sends Subscribe to the Subscription tab", () => {
    show("/shop");

    expect(link("Subscribe")).toHaveAttribute("href", "/subscriptions");
  });

  it.each(["/subscriptions", "/subscriptions/pay/a-token", "/subscriptions/edit/a-token"])("marks Subscribe at %s, and nothing else", (path) => {
    show(path);

    expect(active("Subscribe")).toBe(true);
    expect(active("Shop")).toBe(false);
    expect(active("Gifting")).toBe(false);
  });

  it("keeps every label on one line", () => {
    show("/shop");

    for (const a of screen.getAllByRole("link")) expect(a).toHaveClass("whitespace-nowrap");
  });

  it("marks where she is in the design's brown and bold, and the rest in its warm grey", () => {
    show("/subscriptions");

    expect(link("Subscribe")).toHaveClass("text-shop-brown");
    expect(link("Subscribe").querySelector("span")).toHaveClass("font-extrabold");
    expect(link("Shop")).toHaveClass("text-shop-muted");
    expect(link("Shop").querySelector("span")).not.toHaveClass("font-extrabold");
  });
});

describe("the nav when the switch is off", () => {
  it("is exactly as it was: Mum Tools, and no Subscribe", () => {
    show("/shop");

    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Gifting", "Mum Tools", "Contact", "Account"]);
    expect(screen.queryByRole("link", { name: /Subscribe/ })).toBeNull();
  });

  it("does not mark anything at /subscriptions (there is no Subscribe item to mark)", () => {
    show("/subscriptions");

    for (const a of screen.getAllByRole("link")) expect(a.className).not.toContain("text-primary");
  });
});

/** Starts her adding extra items to an order, the way the Add extra items button does. */
function StartExtras() {
  const { start } = usePendingExtras();
  useLayoutEffect(() => start("b1"), []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
const showWhileAddingExtras = (address: string) => {
  useAuth.mockReturnValue({ user: null });
  return render(
    <MemoryRouter initialEntries={[address]}>
      <PendingExtrasProvider>
        <StartExtras />
        <MobileNav />
      </PendingExtrasProvider>
    </MemoryRouter>,
  );
};

describe("the bottom navigation while she is adding extra items to an order", () => {
  beforeEach(() => subscribeOn.mockReturnValue(true));

  it.each(["/shop", "/shop/baby-care", "/catalogue", "/catalogue/some-product"])("is not there in the shop (%s): the shop is a focused screen with its own bars", (path) => {
    showWhileAddingExtras(path);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it.each(["/subscriptions", "/account", "/gifting"])("is there everywhere else (%s), so she is never trapped", (path) => {
    showWhileAddingExtras(path);
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("is there in the shop when she is not adding extra items", () => {
    show("/shop");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("is there in the shop when the new experience is off, whatever was left over", () => {
    subscribeOn.mockReturnValue(false);
    showWhileAddingExtras("/shop");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
