import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroCarousel } from "./HeroCarousel";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

const show = () =>
  render(
    <MemoryRouter>
      <HeroCarousel />
    </MemoryRouter>,
  );

const slides = () => document.querySelectorAll<HTMLElement>("[data-slide]");
const visibleSlide = () => Array.from(slides()).filter((s) => s.getAttribute("aria-hidden") === "false").map((s) => s.dataset.slide);
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const dots = () => screen.getAllByRole("button", { name: /Show slide/ });

describe("the hero carousel", () => {
  it("has four slides, the first showing", () => {
    show();

    expect(slides()).toHaveLength(4);
    expect(visibleSlide()).toEqual(["shop"]);
    expect(screen.getByRole("heading", { level: 1, name: "Everything for baby and mum, at your door." })).toBeInTheDocument();
  });

  it("has a dot for each slide, marking the one showing", () => {
    show();

    expect(dots()).toHaveLength(4);
    expect(dots()[0]).toHaveAttribute("aria-current", "true");
    expect(dots()[1]).not.toHaveAttribute("aria-current");
  });

  it("moves on and back with the arrows, wrapping round", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(visibleSlide()).toEqual(["toys"]);

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(visibleSlide()).toEqual(["share"]);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(visibleSlide()).toEqual(["shop"]);
  });

  it("goes to the slide whose dot is tapped", () => {
    show();

    fireEvent.click(dots()[2]);

    expect(visibleSlide()).toEqual(["gift"]);
    expect(dots()[2]).toHaveAttribute("aria-current", "true");
  });

  it("moves on by itself every six seconds", () => {
    show();

    tick(6000);
    expect(visibleSlide()).toEqual(["toys"]);

    tick(6000);
    expect(visibleSlide()).toEqual(["gift"]);
  });

  it("leaves the slide alone while the pointer is over it", () => {
    show();
    const carousel = screen.getByRole("group", { name: "1 of 4" }).parentElement as HTMLElement;

    fireEvent.mouseEnter(carousel);
    tick(20_000);
    expect(visibleSlide()).toEqual(["shop"]);

    fireEvent.mouseLeave(carousel);
    tick(6000);
    expect(visibleSlide()).toEqual(["toys"]);
  });

  it("waits twelve seconds after the shopper changes slide themselves", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    tick(11_000);
    expect(visibleSlide()).toEqual(["toys"]); // still the one they chose

    tick(1000);
    expect(visibleSlide()).toEqual(["gift"]);
  });

  it("keeps the slides it is not showing out of reach of a screen reader", () => {
    show();

    const hidden = Array.from(slides()).filter((s) => s.getAttribute("aria-hidden") === "true");
    expect(hidden).toHaveLength(3);
    for (const slide of hidden) expect(slide).toHaveStyle({ visibility: "hidden" });
  });
});

describe("what each slide's button does", () => {
  it("scrolls to the categories from the first", () => {
    const target = document.createElement("section");
    target.id = "shop";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    show();

    fireEvent.click(screen.getByRole("button", { name: /Start shopping/ }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("scrolls to the toys group from the toys slide, without leaving the page", () => {
    const target = document.createElement("section");
    target.id = "g-back-to-school";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    show();
    fireEvent.click(dots()[1]);

    const slide = screen.getByRole("group", { name: "2 of 4" });
    fireEvent.click(within(slide).getByRole("button", { name: /Shop toys/ }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(within(slide).queryByRole("link", { name: /Shop toys/ })).toBeNull(); // a button, not a link to another page
  });

  it("scrolls to the categories instead if the toys group is not on the page", () => {
    const categories = document.createElement("section");
    categories.id = "shop";
    categories.scrollIntoView = vi.fn();
    document.body.appendChild(categories);
    show();
    fireEvent.click(dots()[1]);

    fireEvent.click(within(screen.getByRole("group", { name: "2 of 4" })).getByRole("button", { name: /Shop toys/ }));

    expect(categories.scrollIntoView).toHaveBeenCalled();
  });

  it.each([
    [2, "Send a gift card", "/gifting"],
    [3, "Start sharing", "/share"],
  ])("goes somewhere real from slide %i", (index, label, href) => {
    show();
    fireEvent.click(dots()[index]);

    const slide = screen.getByRole("group", { name: `${index + 1} of 4` });

    expect(within(slide).getByRole("link", { name: new RegExp(label) })).toHaveAttribute("href", href);
  });
});
