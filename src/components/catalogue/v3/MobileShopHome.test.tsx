import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileShopHome } from "./MobileShopHome";
import { TREE } from "./testFixtures";

// The cart and wallet talk to the cart context and the API; they are not what is under test.
vi.mock("@/components/cart", () => ({ HeaderCartIcon: () => <button type="button" aria-label="Open cart" /> }));
vi.mock("@/components/wallet/WalletBalancePill", () => ({
  WalletBalancePill: ({ variant }: { variant?: string }) => <button type="button">{`wallet:${variant}`}</button>,
}));

beforeEach(() => {
  vi.useFakeTimers();
  window.scrollTo = vi.fn() as never;
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function show(over: Partial<React.ComponentProps<typeof MobileShopHome>> = {}) {
  const props = {
    groups: TREE,
    hasReorder: false,
    onSearch: vi.fn(),
    onReorder: vi.fn(),
    onCategory: vi.fn(),
    ...over,
  };
  const view = render(
    <MemoryRouter>
      <MobileShopHome {...props} />
    </MemoryRouter>,
  );
  const again = (next: Partial<typeof props> = {}) =>
    view.rerender(
      <MemoryRouter>
        <MobileShopHome {...props} {...next} />
      </MemoryRouter>,
    );
  return { props, again };
}

const pill = (name: string) => within(screen.getByRole("navigation", { name: "Shop groups" })).getByRole("button", { name });
const headings = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
const settle = () => act(() => void vi.advanceTimersByTime(200));

describe("the shop on a phone", () => {
  it("shows All first: every group, under its full name, trimmed", () => {
    show();

    expect(headings()).toEqual(["Body Care", "Health & Oral Care", "Learning Resource"]);
    expect(pill("All")).toHaveAttribute("aria-current", "true");
  });

  it("puts a short label on each pill", () => {
    show();

    const labels = within(screen.getByRole("navigation", { name: "Shop groups" })).getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["All", "Body Care", "Health", "Learning"]);
  });

  it("shows a tile for every category", () => {
    show();

    for (const name of ["Diaper Collectibles", "Body Wash", "Thermometer", "Ring Stack", "Flash Cards"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("shows one group when its pill is tapped, once the fade is done", () => {
    show();

    fireEvent.click(pill("Health"));
    expect(pill("Health")).toHaveAttribute("aria-current", "true"); // the pill moves at once
    expect(headings()).toHaveLength(3); // the old page is still there while it fades

    settle();
    expect(headings()).toEqual(["Health & Oral Care"]);
    expect(screen.getByText("Thermometer")).toBeInTheDocument();
    expect(screen.queryByText("Body Wash")).toBeNull();
  });

  it("shows the group's name at the same size whether it is picked or shown under All", () => {
    show();
    const sizeOf = (name: string) => screen.getByRole("heading", { level: 2, name }).className.match(/text-\[\d+px\]/)?.[0];
    const underAll = sizeOf("Health & Oral Care");

    fireEvent.click(pill("Health"));
    settle();

    expect(underAll).toBe("text-[19px]");
    expect(sizeOf("Health & Oral Care")).toBe(underAll);
    expect(screen.getByRole("heading", { level: 2, name: "Health & Oral Care" })).not.toHaveClass("text-2xl");
  });

  it("brings every group back with All", () => {
    show();
    fireEvent.click(pill("Health"));
    settle();

    fireEvent.click(pill("All"));
    settle();

    expect(headings()).toHaveLength(3);
  });

  it("does nothing when the active pill is tapped again", () => {
    show();

    fireEvent.click(pill("All"));
    settle();

    expect(headings()).toHaveLength(3);
  });

  it("brings the pills back to the top if the shopper had scrolled past them", () => {
    show();
    Object.defineProperty(window, "scrollY", { value: 900, configurable: true });
    const anchor = document.querySelector('[aria-hidden="true"].h-0') as HTMLElement;
    anchor.getBoundingClientRect = () => ({ top: -400 }) as DOMRect; // its page position is 500

    fireEvent.click(pill("Health"));
    settle();

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500 });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("opens a category when its tile is tapped", () => {
    const { props } = show();

    fireEvent.click(screen.getByText("Body Wash"));

    expect(props.onCategory).toHaveBeenCalledWith(TREE[0].categories[1]);
  });
});

describe("tapping an offer that shows part of this page", () => {
  const offer = (name: RegExp) => within(screen.getByRole("region", { name: "Offers" })).getByRole("button", { name });
  /** Where the pills sit on the page: 500px down. */
  const pillsAt500 = () => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    (document.querySelector('[aria-hidden="true"].h-0') as HTMLElement).getBoundingClientRect = () => ({ top: 500 }) as DOMRect;
  };

  it("shows the toys group and scrolls down to it", () => {
    show();
    pillsAt500();

    fireEvent.click(offer(/Play that teaches/));
    settle();

    expect(pill("Learning")).toHaveAttribute("aria-current", "true");
    expect(headings()).toEqual(["Learning Resource"]);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
  });

  it("shows every group and scrolls down to the categories from the shop offer", () => {
    show({ initialGroupSlug: "health-wellness" });
    pillsAt500();

    fireEvent.click(offer(/Everything for baby and mum/));
    settle();

    expect(pill("All")).toHaveAttribute("aria-current", "true");
    expect(headings()).toHaveLength(3);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
  });

  it("brings the toys pill into view in the pill row, not only the group's categories", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    show();
    pillsAt500();
    const before = scrollTo.mock.calls.length; // the row's own placement on first show

    fireEvent.click(offer(/Play that teaches/));

    expect(scrollTo.mock.calls.length).toBeGreaterThan(before);
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    delete (HTMLElement.prototype as unknown as { scrollTo?: unknown }).scrollTo;
  });

  it("shows everything if the toys group no longer exists, and still scrolls", () => {
    show({ groups: TREE.filter((g) => g.slug !== "back-to-school") });
    pillsAt500();

    fireEvent.click(offer(/Play that teaches/));
    settle();

    expect(pill("All")).toHaveAttribute("aria-current", "true");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
  });

  it("scrolls without animation for someone who asked for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null }) as MediaQueryList);
    show();
    pillsAt500();

    fireEvent.click(offer(/Play that teaches/));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "auto" });
    vi.restoreAllMocks();
  });
});

describe("the top row", () => {
  it("has a menu button where the Shop title was, and no visible Shop title", () => {
    show();

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Shop" })).toHaveClass("sr-only"); // kept for screen readers
  });

  it("shows the Nesta Hub logo right beside the menu button, linking to the shop", () => {
    show();
    const menu = screen.getByRole("button", { name: "Open menu" });
    const logo = screen.getByRole("link", { name: "Nesta Hub" });

    expect(logo).toHaveAttribute("href", "/shop");
    expect(logo.querySelector("img")).toBeInTheDocument();
    expect(menu.parentElement).toBe(logo.parentElement); // together on the left
    expect(menu.nextElementSibling).toBe(logo); // the logo comes straight after the menu
  });

  it("opens the site's menu", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("navigation", { name: "Menu" })).toBeInTheDocument();
  });

  it("puts the wallet in the middle, between the menu (with the logo) and the cart", () => {
    show();
    const row = screen.getByRole("heading", { level: 1, name: "Shop" }).parentElement as HTMLElement; // the whole top row
    const wallet = screen.getByText("wallet:outlined").closest("div.absolute") as HTMLElement;

    // Centred on the row itself, not pushed along by whatever sits either side of it.
    expect(wallet).toHaveClass("inset-x-0", "justify-center");
    // And in order: menu, wallet, cart.
    const order = Array.from(row.children);
    const at = (el: Element | null) => order.findIndex((c) => c === el || c.contains(el));
    expect(at(screen.getByRole("button", { name: "Open menu" }))).toBeLessThan(at(wallet));
    expect(at(wallet)).toBeLessThan(at(screen.getAllByRole("button", { name: "Open cart" })[0]));
  });
});

describe("the cart that joins the pills once they stick", () => {
  it("has the same vertical padding as the pill row, so it sits level with the pills", () => {
    show();
    const row = within(screen.getByRole("navigation", { name: "Shop groups" })).getAllByRole("button")[0].parentElement as HTMLElement;
    const cart = screen.getByTestId("stuck-cart");

    expect(row).toHaveClass("pt-2.5", "pb-1.5");
    expect(cart).toHaveClass("pt-2.5", "pb-1.5", "items-center");
  });
});

describe("arriving by address (/shop/:groupSlug)", () => {
  it("starts on that group", () => {
    show({ initialGroupSlug: "back-to-school" });

    expect(pill("Learning")).toHaveAttribute("aria-current", "true");
    expect(headings()).toEqual(["Learning Resource"]);
  });

  it("starts on All for a group that does not exist", () => {
    show({ initialGroupSlug: "no-such-group" });

    expect(pill("All")).toHaveAttribute("aria-current", "true");
    expect(headings()).toHaveLength(3);
  });

  it("follows the address when it changes, even after the shopper picked something", () => {
    const { again } = show();
    fireEvent.click(pill("Health"));
    settle();

    again({ initialGroupSlug: "back-to-school" });

    expect(pill("Learning")).toHaveAttribute("aria-current", "true");
    expect(headings()).toEqual(["Learning Resource"]);
  });

  it("starts on that group once the groups have loaded", () => {
    const { again } = show({ groups: [], loading: true, initialGroupSlug: "back-to-school" });

    again({ groups: TREE, loading: false });

    expect(headings()).toEqual(["Learning Resource"]);
  });
});

describe("search, buy again and the rest", () => {
  it("opens search from the search bar", () => {
    const { props } = show();

    fireEvent.click(screen.getByRole("button", { name: "Search baby products and brands" }));

    expect(props.onSearch).toHaveBeenCalled();
  });

  it("offers Buy again only to someone who has something to buy again", () => {
    show();
    expect(screen.queryByRole("button", { name: "Buy again" })).toBeNull();
  });

  it("opens Buy again", () => {
    const { props } = show({ hasReorder: true });

    fireEvent.click(screen.getByRole("button", { name: "Buy again" }));

    expect(props.onReorder).toHaveBeenCalled();
  });

  it("shows the outlined wallet pill", () => {
    show();

    expect(screen.getByText("wallet:outlined")).toBeInTheDocument();
  });

  it("shows four offers: the shop, toys, gift cards and referrals", () => {
    show();
    const offers = within(screen.getByRole("region", { name: "Offers" }));

    expect(offers.getByText("Everything for baby and mum")).toBeInTheDocument();
    expect(offers.getByText("Play that teaches")).toBeInTheDocument();
    expect(offers.getByText("Send a gift card")).toBeInTheDocument();
    expect(offers.getByText("Know a mum? Earn rewards")).toBeInTheDocument();
  });

  it("sends the referral offer to the share page, and says a tote bag after 4 referrals", () => {
    show();
    const referral = within(screen.getByRole("region", { name: "Offers" })).getByRole("link", { name: /Know a mum/ });

    expect(referral).toHaveAttribute("href", "/share");
    expect(referral).toHaveTextContent("A tote bag after 4 referrals.");
  });

  it("sends the gift card offer to the gifting page", () => {
    show();

    expect(within(screen.getByRole("region", { name: "Offers" })).getByRole("link", { name: /Send a gift card/ })).toHaveAttribute("href", "/gifting");
  });

  it("links to Contact for anything they cannot find", () => {
    show();

    expect(screen.getByRole("link", { name: "Message us" })).toHaveAttribute("href", "/contact");
  });

  it("shows placeholders while the groups load", () => {
    show({ groups: [], loading: true });

    expect(screen.getByRole("status", { name: "Loading categories" })).toBeInTheDocument();
  });

  it("leaves out a group with no categories", () => {
    show({ groups: [...TREE, { ...TREE[0], id: "empty", slug: "empty", name: "Empty", categories: [] }] });

    expect(screen.queryByText("Empty")).toBeNull();
  });
});
