import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RenewalFrequency } from "@/lib/subscriptionBoxes";
import { RenewalFrequencyPicker } from "./RenewalFrequencyPicker";

const show = (value: RenewalFrequency) => {
  const onChange = vi.fn();
  render(<RenewalFrequencyPicker value={value} onChange={onChange} />);
  return onChange;
};

describe("RenewalFrequencyPicker", () => {
  it("offers the three ways, with the current one chosen", () => {
    show({ kind: "weeks", every: 4 });
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Every few weeks", "Monthly, on a particular date", "Monthly, on a particular day"]);
    expect(screen.getByRole("radio", { name: "Every few weeks" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Monthly, on a particular date" })).toHaveAttribute("aria-checked", "false");
  });

  it("weeks: shows the words and steps by one", () => {
    const onChange = show({ kind: "weeks", every: 4 });
    expect(screen.getByText("Every 4 weeks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More weeks" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "weeks", every: 5 });
    fireEvent.click(screen.getByRole("button", { name: "Fewer weeks" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "weeks", every: 3 });
  });

  it("weeks: cannot go below one or above twelve", () => {
    show({ kind: "weeks", every: 1 });
    expect(screen.getByRole("button", { name: "Fewer weeks" })).toBeDisabled();
  });

  it("weeks: stops at twelve", () => {
    const onChange = show({ kind: "weeks", every: 12 });
    fireEvent.click(screen.getByRole("button", { name: "More weeks" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "weeks", every: 12 });
  });

  it("date: steps through the month and wraps round", () => {
    const onChange = show({ kind: "month_date", day: 31 });
    expect(screen.getByText("On the 31st")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Later date" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_date", day: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Earlier date" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_date", day: 30 });
  });

  it("date: says it in full underneath", () => {
    show({ kind: "month_date", day: 25 });
    expect(screen.getByText("On the 25th of every month")).toBeInTheDocument();
  });

  it("day: picks which one in the month and which weekday", () => {
    const onChange = show({ kind: "month_weekday", nth: 2, weekday: 2 });
    expect(screen.getByText("The 2nd Tuesday of every month")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Last" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_weekday", nth: -1, weekday: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Fri" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_weekday", nth: 2, weekday: 5 });
  });

  it("marks the chosen ones", () => {
    show({ kind: "month_weekday", nth: 2, weekday: 2 });
    expect(screen.getByRole("button", { name: "2nd" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tue" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switching way starts it somewhere sensible", () => {
    const onChange = show({ kind: "weeks", every: 6 });
    fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular date" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_date", day: 25 });
    fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular day" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "month_weekday", nth: 1, weekday: 1 });
  });

  it("marks the chosen way and pill in the design's light brown, with weekdays smaller so seven fit", () => {
    show({ kind: "month_weekday", nth: 2, weekday: 2 });
    expect(screen.getByRole("radio", { name: "Monthly, on a particular day" }).parentElement).toHaveClass("border-[#A08B76]");
    expect(screen.getByRole("radio", { name: "Every few weeks" }).parentElement).toHaveClass("border-[#E5E0DC]");
    expect(screen.getByRole("button", { name: "2nd" })).toHaveClass("text-[#A08B76]", "text-[14px]", "font-medium");
    expect(screen.getByRole("button", { name: "Tue" })).toHaveClass("text-[12.5px]");
  });

  it("only the chosen way shows its controls", () => {
    show({ kind: "weeks", every: 4 });
    expect(screen.queryByRole("button", { name: "Later date" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tue" })).toBeNull();
  });
});
