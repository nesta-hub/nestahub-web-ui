import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopHeader } from "./DesktopHeader";

const useRecentVariants = vi.fn();
vi.mock("@/hooks/useCatalogue", () => ({ useRecentVariants: (...args: unknown[]) => useRecentVariants(...args) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, session: { access_token: "t" } }) }));
vi.mock("@/components/cart/HeaderCartIcon", () => ({ HeaderCartIcon: () => <button type="button" aria-label="Open cart" /> }));
vi.mock("@/components/wallet/WalletBalancePill", () => ({
  WalletBalancePill: ({ variant, iconOnly }: { variant?: string; iconOnly?: boolean }) => (
    <button type="button" data-testid="wallet" data-variant={variant ?? "filled"} data-icononly={String(!!iconOnly)}>
      wallet
    </button>
  ),
}));

beforeEach(() => {
  useRecentVariants.mockReset();
  useRecentVariants.mockReturnValue({ data: { variants: [] } });
});

function Where() {
  const l = useLocation();
  return <output aria-label="address">{l.pathname + l.search}</output>;
}

const show = (address: string) =>
  render(
    <MemoryRouter initialEntries={[address]}>
      <DesktopHeader />
      <Where />
    </MemoryRouter>,
  );

const search = () => screen.queryByRole("textbox", { name: "Search baby products and brands" }) as HTMLInputElement | null;
const address = () => screen.getByLabelText("address").textContent;

describe("the header on the shop", () => {
  it.each(["/shop", "/shop/baby-care", "/shop/baby-care/body-wash", "/catalogue"])("has the search box at %s", (path) => {
    show(path);

    expect(search()).toBeInTheDocument();
  });

  it("puts what is typed in the address, for the shop to show results", () => {
    show("/shop/baby-care");

    fireEvent.change(search()!, { target: { value: "bib" } });

    expect(address()).toBe("/shop/baby-care?q=bib");
  });

  it("shows what is already in the address", () => {
    show("/shop?q=cup");

    expect(search()!.value).toBe("cup");
  });

  it("takes the search out of the address when it is cleared", () => {
    show("/shop?q=cup");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(address()).toBe("/shop");
  });

  it("takes it out when the text is deleted by hand, too", () => {
    show("/shop?q=cup");

    fireEvent.change(search()!, { target: { value: "" } });

    expect(address()).toBe("/shop");
  });

  it("keeps the rest of the address when searching", () => {
    show("/shop?product=zebra-bib");

    fireEvent.change(search()!, { target: { value: "bib" } });

    expect(address()).toBe("/shop?product=zebra-bib&q=bib");
  });

  it("shows the outlined wallet pill with the balance", () => {
    show("/shop");

    expect(screen.getByTestId("wallet")).toHaveAttribute("data-variant", "outlined");
  });

  it("makes room for it: a wider header", () => {
    const { container } = show("/shop");

    expect(container.querySelector("header > div")).toHaveClass("max-w-[1680px]");
  });

  it("has no Home link: there is no home page, so Shop comes first", () => {
    show("/shop");

    const nav = screen.getByRole("navigation");
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["Shop", "Gifting", "Share", "Contact Us"]);
    expect(within(nav).queryByRole("link", { name: "Home" })).toBeNull();
  });

  it("takes the logo to the shop", () => {
    show("/gifting");

    expect(screen.getByRole("link", { name: "Nesta Hub" })).toHaveAttribute("href", "/shop");
  });

  it.each(["/shop", "/shop/baby-care", "/catalogue", "/catalogue/some-product"])("marks Shop as the page you are on at %s", (path) => {
    show(path);

    expect(screen.getByRole("link", { name: "Shop" })).toHaveClass("text-nesta-sage");
    expect(screen.getByRole("link", { name: "Gifting" })).not.toHaveClass("text-nesta-sage");
  });

  it("does not mark Shop on other pages", () => {
    show("/gifting");

    expect(screen.getByRole("link", { name: "Shop" })).not.toHaveClass("text-nesta-sage");
    expect(screen.getByRole("link", { name: "Gifting" })).toHaveClass("text-nesta-sage");
  });
});

describe("Buy again in the search box", () => {
  it("is not offered to someone with nothing to buy again", () => {
    show("/shop");

    expect(screen.queryByRole("button", { name: "Buy again" })).toBeNull();
  });

  it("opens the panel through the address", () => {
    useRecentVariants.mockReturnValue({ data: { variants: [{ id: "v" }] } });
    show("/shop");

    fireEvent.click(screen.getByRole("button", { name: "Buy again" }));

    expect(address()).toBe("/shop?reorder=1");
  });

  it("gives way to the clear button while there is a search", () => {
    useRecentVariants.mockReturnValue({ data: { variants: [{ id: "v" }] } });
    show("/shop?q=cup");

    expect(screen.queryByRole("button", { name: "Buy again" })).toBeNull();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });
});

describe("the header elsewhere", () => {
  it("has no shop search on other pages", () => {
    show("/gifting");

    expect(search()).toBeNull();
    expect(screen.queryByTestId("wallet")).toBeNull();
    expect(useRecentVariants).not.toHaveBeenCalled(); // nothing is fetched for a box that is not there
  });

  it("keeps the small wallet icon on a product page, as before", () => {
    show("/catalogue/some-product");

    expect(search()).toBeNull();
    expect(screen.getByTestId("wallet")).toHaveAttribute("data-icononly", "true");
    expect(screen.getByTestId("wallet")).toHaveAttribute("data-variant", "filled");
  });

  it("keeps its usual width", () => {
    const { container } = show("/gifting");

    expect(container.querySelector("header > div")).not.toHaveClass("max-w-[1680px]");
  });
});
