import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileShopHome } from "./MobileShopHome";
import { MOBILE_OFFERS } from "./offers";
import { TREE } from "./testFixtures";

// The cart talks to the cart context and the API; it is not what is under test.
vi.mock("@/components/cart", () => ({ HeaderCartIcon: () => <button type="button" aria-label="Open cart" /> }));
// Signed in or not is the one thing these tests change; the welcome card has tests of its own.
const auth = vi.hoisted(() => ({ session: null as { access_token: string } | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ session: auth.session }) }));
vi.mock("./WelcomeCard", () => ({
  // The tap on "Shop now" is passed in, so a stub button stands in for it.
  SignedInWelcome: ({ onShop }: { onShop: () => void }) => (
    <button type="button" data-testid="welcome" onClick={onShop}>
      welcome card
    </button>
  ),
  // What the dev-only preview renders: say whose card it is.
  WelcomeCard: ({ name, balanceKobo, onShop }: { name: string | null; balanceKobo: number | null; onShop: () => void }) => (
    <button type="button" data-testid="welcome-preview" onClick={onShop}>{`${name} | ${balanceKobo}`}</button>
  ),
}));

beforeEach(() => {
  auth.session = null;
  vi.useFakeTimers();
  window.scrollTo = vi.fn() as never;
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function show(over: Partial<React.ComponentProps<typeof MobileShopHome>> = {}, address = "/") {
  const props = {
    groups: TREE,
    hasReorder: false,
    onSearch: vi.fn(),
    onReorder: vi.fn(),
    onCategory: vi.fn(),
    ...over,
  };
  const view = render(
    <MemoryRouter initialEntries={[address]}>
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

  it("shows every group and scrolls down to the categories from the Community Delivery card", () => {
    show({ initialGroupSlug: "health-wellness" });
    pillsAt500();

    fireEvent.click(offer(/Good news!/));
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

  it.each([
    ["signed out", null],
    ["signed in", { access_token: "tok" }],
  ])("puts the menu on the left, the Nesta Hub logo in the middle and the cart on the right, %s", (_who, session) => {
    auth.session = session;
    show();
    const at = (el: Element) => Array.from(document.querySelectorAll("*")).indexOf(el);
    const menu = screen.getByRole("button", { name: "Open menu" });
    const logo = screen.getByRole("link", { name: "Nesta Hub" });
    const cart = screen.getAllByRole("button", { name: "Open cart" })[0];

    expect(logo).toHaveAttribute("href", "/shop");
    expect(logo.querySelector("img")).toBeInTheDocument();
    expect(at(menu)).toBeLessThan(at(logo));
    expect(at(logo)).toBeLessThan(at(cart));
    // The row is a menu cell, a wide middle cell holding the logo, and a cart cell
    // (the first child is the visually hidden "Shop" title).
    const row = logo.parentElement as HTMLElement;
    expect(row).toHaveClass("grid");
    expect(Array.from(row.children).slice(1)).toEqual([menu, logo, cart.parentElement]);
    expect(logo).toHaveClass("justify-center");
  });

  it("opens the site's menu", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("navigation", { name: "Menu" })).toBeInTheDocument();
  });

  it("has no wallet in it: a signed-in customer's balance is in the welcome card", () => {
    auth.session = { access_token: "tok" };
    show();

    expect(screen.getByRole("heading", { level: 1, name: "Shop" }).parentElement).not.toHaveTextContent(/wallet/i);
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

    // No argument: the click event must not leak in as a search word.
    expect(props.onSearch).toHaveBeenCalledTimes(1);
    expect(props.onSearch).toHaveBeenCalledWith();
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

  it("shows six offers: the shop, Moobi, Community Delivery, toys, gift cards and referrals", () => {
    show();
    const offers = within(screen.getByRole("region", { name: "Offers" }));

    expect(offers.getByText("Everything for baby and mum")).toBeInTheDocument();
    expect(offers.getByText("Good news!")).toBeInTheDocument();
    expect(offers.getByText("Moobi is here")).toBeInTheDocument();
    expect(offers.getByText("Play that teaches")).toBeInTheDocument();
    expect(offers.getByText("Send a gift card")).toBeInTheDocument();
    expect(offers.getByText("Earn rewards")).toBeInTheDocument();
  });

  it("sends the referral offer to the share page, and says a tote bag after 4 referrals", () => {
    show();
    const referral = within(screen.getByRole("region", { name: "Offers" })).getByRole("link", { name: /Earn rewards/ });

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

describe("the shop, Community Delivery and Moobi cards", () => {
  const card = (name: RegExp) => within(screen.getByRole("region", { name: "Offers" })).getByRole("button", { name });

  it("has no 'Shop now' button on the everything-for-baby-and-mum card", () => {
    show();

    expect(card(/Everything for baby and mum/)).not.toHaveTextContent(/shop now/i);
    expect(screen.queryByText(/shop now/i)).toBeNull();
  });

  it("tells Gbagada, Anthony and Bariga that Community Delivery is ₦500 on Wednesdays and Saturdays", () => {
    show();

    expect(card(/Good news!/)).toHaveTextContent("COMMUNITY DELIVERY");
    expect(card(/Good news!/)).toHaveTextContent(
      "Just ₦500 delivery to Gbagada, Anthony and Bariga, every Wednesday and Saturday.",
    );
    // The seal on the right states the price.
    expect(card(/Good news!/)).toHaveTextContent("ONLY");
    // A message, not a sales pitch: no button on it.
    expect(card(/Good news!/)).not.toHaveTextContent(/shop|order|start/i);
  });

  it("shows the days in a colour of their own, so they stand out", () => {
    show();
    const days = Array.from(card(/Good news!/).querySelectorAll("[data-highlight]"));

    expect(days.map((el) => el.textContent)).toEqual(["Wednesday and Saturday"]);
    // The same colour as the "COMMUNITY DELIVERY" badge above them.
    const badge = Array.from(card(/Good news!/).querySelectorAll("span")).find((el) => el.textContent === "COMMUNITY DELIVERY");
    expect(badge).toBeDefined();
    expect(days[0]).toHaveStyle({ color: "#7A4F33" });
    expect(badge).toHaveStyle({ color: "#7A4F33" });
    expect(card(/Good news!/)).not.toHaveTextContent("==");
  });

  it("shows the three areas that get Community Delivery in bold, and nothing else", () => {
    show();
    const bold = Array.from(card(/Good news!/).querySelectorAll("strong")).map((el) => el.textContent);

    expect(bold).toEqual(["Gbagada", "Anthony", "Bariga"]);
    // The markers themselves never reach the screen.
    expect(card(/Good news!/)).not.toHaveTextContent("**");
  });

  it("says Moobi is now on Nesta Hub, with its logo and a button to its products", () => {
    show();
    const moobi = card(/Moobi is here/);

    expect(moobi).toHaveTextContent("NOW ON NESTA HUB");
    expect(moobi).toHaveTextContent("Check out the Moobi range of baby products");
    expect(moobi).toHaveTextContent("Shop Moobi");
    // It is a known brand: the card says it has arrived, it does not introduce it.
    expect(moobi).not.toHaveTextContent(/meet/i);
    expect(moobi.querySelector("img")).not.toBeNull();
  });

  it("opens the search with Moobi already typed in when the Moobi card is tapped", () => {
    const { props } = show();

    fireEvent.click(card(/Moobi is here/));

    expect(props.onSearch).toHaveBeenCalledTimes(1);
    expect(props.onSearch).toHaveBeenCalledWith("Moobi");
  });
});

describe("signed in", () => {
  beforeEach(() => {
    auth.session = { access_token: "tok" };
  });

  it("shows every group and scrolls down to the categories when 'Shop now' is tapped", () => {
    show({ initialGroupSlug: "health-wellness" });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    (document.querySelector('[aria-hidden="true"].h-0') as HTMLElement).getBoundingClientRect = () => ({ top: 500 }) as DOMRect;

    fireEvent.click(screen.getByTestId("welcome"));
    settle();

    expect(pill("All")).toHaveAttribute("aria-current", "true");
    expect(headings()).toHaveLength(3);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
  });

  it("gives the welcome card the Nesta Hub advert's soft blue, the card it stands in for", () => {
    show();

    expect(MOBILE_OFFERS[0].id).toBe("shop");
    expect(document.querySelector("[data-welcome]")).toHaveStyle({ background: MOBILE_OFFERS[0].bg });
  });

  const offers = () => within(screen.getByRole("region", { name: "Offers" }));

  it("opens with the welcome card where the 'Everything for baby and mum' advert was", () => {
    show();

    expect(offers().getByTestId("welcome")).toBeInTheDocument();
    expect(offers().queryByText("Everything for baby and mum")).toBeNull();
    // The other offers are still there, and so is every slide.
    expect(offers().getByText("Good news!")).toBeInTheDocument();
    expect(offers().getByText("Moobi is here")).toBeInTheDocument();
    expect(offers().getByText("Play that teaches")).toBeInTheDocument();
    expect(offers().getByText("Send a gift card")).toBeInTheDocument();
    expect(offers().getByText("Earn rewards")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Offers" }).querySelectorAll("[data-offer]")).toHaveLength(6);
  });
});

describe("the dev-only welcome card preview (?welcome=1), for looking at it without signing in", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("shows the signed-in first card, for a made-up customer, to someone who isn't signed in", () => {
    show({}, "/shop?welcome=1");

    expect(screen.getByTestId("welcome-preview")).toHaveTextContent("Sade | 1006000");
    expect(screen.queryByText("Everything for baby and mum")).toBeNull();
    expect(screen.queryByTestId("welcome")).toBeNull();
  });

  it("is not there without ?welcome", () => {
    show({}, "/shop");

    expect(screen.queryByTestId("welcome-preview")).toBeNull();
    expect(screen.getByText("Everything for baby and mum")).toBeInTheDocument();
  });

  it("leaves a really signed-in customer with their own card", () => {
    auth.session = { access_token: "tok" };
    show({}, "/shop?welcome=1");

    expect(screen.getByTestId("welcome")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-preview")).toBeNull();
  });

  it("is switched off outside the dev server", () => {
    vi.stubEnv("DEV", false);
    show({}, "/shop?welcome=1");

    expect(screen.queryByTestId("welcome-preview")).toBeNull();
    expect(screen.getByText("Everything for baby and mum")).toBeInTheDocument();
  });
});

describe("signed out", () => {
  it("keeps the 'Everything for baby and mum' advert first, with no welcome card", () => {
    show();

    expect(screen.queryByTestId("welcome")).toBeNull();
    expect(within(screen.getByRole("region", { name: "Offers" })).getByText("Everything for baby and mum")).toBeInTheDocument();
  });
});
