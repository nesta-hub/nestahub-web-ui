import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryChips } from "./CategoryChips";

const categories = ["Baby Milk", "Diaper Collectibles", "Weaning Foods", "Wipes Collectibles", "Body Wash", "Shampoo"].map((name, i) => ({ id: `c${i}`, name }));

describe("the category pills", () => {
  it("sit in one row she swipes sideways, never wrapping onto more lines", () => {
    render(<CategoryChips categories={categories} value={null} onChange={vi.fn()} />);
    const row = screen.getByRole("group", { name: "Categories" });
    expect(row).toHaveClass("flex", "overflow-x-auto");
    expect(row).not.toHaveClass("flex-wrap");
    for (const pill of within(row).getAllByRole("button")) expect(pill).toHaveClass("shrink-0", "whitespace-nowrap");
  });

  it("start with All, and pick a category", () => {
    const onChange = vi.fn();
    render(<CategoryChips categories={categories} value={null} onChange={onChange} />);
    const pills = within(screen.getByRole("group", { name: "Categories" })).getAllByRole("button");
    expect(pills.map((p) => p.textContent)).toEqual(["All", ...categories.map((c) => c.name)]);
    expect(pills[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Shampoo" }));
    expect(onChange).toHaveBeenCalledWith("c5");
  });
});
