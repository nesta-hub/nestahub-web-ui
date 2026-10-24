import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopShopHome } from "./DesktopShopHome";
import { TREE } from "./testFixtures";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 0));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const show = (props: Partial<React.ComponentProps<typeof DesktopShopHome>> = {}) =>
  render(
    <MemoryRouter>
      <DesktopShopHome groups={TREE} {...props} />
    </MemoryRouter>,
  );

const pills = () => within(screen.getByRole("navigation", { name: "Jump to a group" }));

describe("the shop home on desktop", () => {
  it("opens with the hero, the reasons to shop and the categories heading", () => {
    show();

    expect(screen.getByRole("region", { name: "Offers" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Why shop with us" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Browse every category" })).toBeInTheDocument();
  });

  it("has a pill for each group with its short label", () => {
    show();

    expect(pills().getAllByRole("button").map((b) => b.textContent)).toEqual(["Body Care", "Health", "Learning"]);
  });

  it("shows a mosaic for each group, in order", () => {
    show();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(expect.arrayContaining(["Body Care", "Health & Oral Care", "Learning Resource"]));
    expect(headings.indexOf("Body Care")).toBeLessThan(headings.indexOf("Learning Resource"));
  });

  it("scrolls to a group when its pill is tapped", () => {
    show();
    const section = document.getElementById("g-health-wellness") as HTMLElement;
    section.scrollIntoView = vi.fn();

    fireEvent.click(pills().getByRole("button", { name: "Health" }));

    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("marks the pill of the group in view, as the page scrolls", () => {
    show();
    const top = (id: string, value: number) => ((document.getElementById(id) as HTMLElement).getBoundingClientRect = () => ({ top: value }) as DOMRect);
    top("g-baby-care", -900);
    top("g-health-wellness", 120);
    top("g-back-to-school", 900);

    act(() => void window.dispatchEvent(new Event("scroll")));

    expect(pills().getByRole("button", { name: "Health" })).toHaveAttribute("aria-current", "true");
    expect(pills().getByRole("button", { name: "Body Care" })).not.toHaveAttribute("aria-current");
  });

  it("starts with the first group's pill marked, while the others are still below the fold", () => {
    // In a real page the later groups sit further down; jsdom would put every one at the top.
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const below = { "g-baby-care": 600, "g-health-wellness": 1400, "g-back-to-school": 2200 } as Record<string, number>;
      return { top: below[this.id] ?? 0 } as DOMRect;
    });

    show();

    expect(pills().getByRole("button", { name: "Body Care" })).toHaveAttribute("aria-current", "true");
    expect(pills().getByRole("button", { name: "Learning" })).not.toHaveAttribute("aria-current");
    spy.mockRestore();
  });

  it("leaves out a group with no categories", () => {
    show({ groups: [...TREE, { ...TREE[0], id: "x", slug: "empty", name: "Empty", categories: [] }] });

    expect(pills().queryByRole("button", { name: "Empty" })).toBeNull();
    expect(document.getElementById("g-empty")).toBeNull();
  });

  it("shows placeholders while the groups load", () => {
    show({ groups: [], loading: true });

    expect(screen.getByRole("status", { name: "Loading categories" })).toBeInTheDocument();
  });

  it("points anyone who cannot find something to Contact", () => {
    show();

    expect(screen.getByRole("link", { name: /Contact us/ })).toHaveAttribute("href", "/contact");
  });
});
