import { fireEvent, render, screen } from "@testing-library/react";
import { Baby, LayoutGrid } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupPillRow } from "./GroupPillRow";

const items = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "nursery", label: "Nursery", icon: Baby },
];

describe("the group pills", () => {
  it("shows a pill for each group, in a labelled navigation", () => {
    render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="Shop groups" />);

    expect(screen.getByRole("navigation", { name: "Shop groups" })).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["All", "Nursery"]);
  });

  it("marks only the active pill", () => {
    render(<GroupPillRow items={items} activeId="nursery" onSelect={vi.fn()} ariaLabel="g" />);

    expect(screen.getByRole("button", { name: "Nursery" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "All" })).not.toHaveAttribute("aria-current");
  });

  it("fills the active pill brown and leaves the others white", () => {
    render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" />);

    expect(screen.getByRole("button", { name: "All" })).toHaveClass("bg-shop-brown");
    expect(screen.getByRole("button", { name: "Nursery" })).toHaveClass("bg-white");
  });

  it("reports the pill that was tapped", () => {
    const onSelect = vi.fn();
    render(<GroupPillRow items={items} activeId="all" onSelect={onSelect} ariaLabel="g" />);

    fireEvent.click(screen.getByRole("button", { name: "Nursery" }));

    expect(onSelect).toHaveBeenCalledWith("nursery");
  });

  it("scrolls the row so the tapped pill is in the middle (phone layout)", () => {
    render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" layout="scroll" />);
    const row = screen.getByRole("button", { name: "All" }).parentElement as HTMLElement;
    const scrollTo = vi.fn();
    row.scrollTo = scrollTo;
    Object.defineProperty(row, "clientWidth", { value: 300 });
    const pill = screen.getByRole("button", { name: "Nursery" });
    Object.defineProperty(pill, "offsetLeft", { value: 400 });
    Object.defineProperty(pill, "offsetWidth", { value: 100 });

    fireEvent.click(pill);

    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "smooth" }); // 400 - (300 - 100) / 2
  });

  it("does not scroll a centred row (desktop)", () => {
    render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" layout="center" />);
    const row = screen.getByRole("button", { name: "All" }).parentElement as HTMLElement;
    const scrollTo = vi.fn();
    row.scrollTo = scrollTo;

    fireEvent.click(screen.getByRole("button", { name: "Nursery" }));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("keeping the active pill in view", () => {
  const stub = (row: HTMLElement, pill: HTMLElement) => {
    const scrollTo = vi.fn();
    row.scrollTo = scrollTo;
    Object.defineProperty(row, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(pill, "offsetLeft", { value: 400, configurable: true });
    Object.defineProperty(pill, "offsetWidth", { value: 100, configurable: true });
    return scrollTo;
  };

  afterEach(() => {
    delete (HTMLElement.prototype as unknown as { scrollTo?: unknown }).scrollTo;
  });

  it("scrolls to a pill that became active without being tapped, such as an advert picking a group", () => {
    const { rerender } = render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" />);
    const scrollTo = stub(screen.getByRole("button", { name: "All" }).parentElement as HTMLElement, screen.getByRole("button", { name: "Nursery" }));

    rerender(<GroupPillRow items={items} activeId="nursery" onSelect={vi.fn()} ariaLabel="g" />);

    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "smooth" }); // 400 - (300 - 100) / 2
  });

  it("starts with the active pill in view, without a scroll animation", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });

    render(<GroupPillRow items={items} activeId="nursery" onSelect={vi.fn()} ariaLabel="g" />);

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("does not scroll again while the active pill stays the same", () => {
    const { rerender } = render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" />);
    const scrollTo = stub(screen.getByRole("button", { name: "All" }).parentElement as HTMLElement, screen.getByRole("button", { name: "Nursery" }));

    rerender(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" />);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves a centred row alone", () => {
    const { rerender } = render(<GroupPillRow items={items} activeId="all" onSelect={vi.fn()} ariaLabel="g" layout="center" />);
    const scrollTo = stub(screen.getByRole("button", { name: "All" }).parentElement as HTMLElement, screen.getByRole("button", { name: "Nursery" }));

    rerender(<GroupPillRow items={items} activeId="nursery" onSelect={vi.fn()} ariaLabel="g" layout="center" />);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
