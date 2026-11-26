import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { startingChoice, type SubscribeChoice } from "./choice";
import { SubscribeCard } from "./SubscribeCard";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


const NOW = new Date("2026-11-15T09:00:00.000Z"); // Sun 15 Nov, Lagos

interface Opts {
  value?: SubscribeChoice | null;
  price?: number;
  subscriptionPrice?: number | null;
  recommendedFrequencyWeeks?: number | null;
  quantity?: number;
}

/** The card, held by a parent that keeps the choice, as a product page does. */
function show(opts: Opts = {}) {
  const onChange = vi.fn();
  function Host() {
    const [value, setValue] = useState<SubscribeChoice | null>(opts.value ?? null);
    return (
      <SubscribeCard
        price={opts.price ?? 500_000}
        subscriptionPrice={opts.subscriptionPrice === undefined ? 450_000 : opts.subscriptionPrice}
        recommendedFrequencyWeeks={opts.recommendedFrequencyWeeks === undefined ? 4 : opts.recommendedFrequencyWeeks}
        quantity={opts.quantity ?? 1}
        value={value}
        now={NOW}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  render(<Host />);
  return onChange;
}

const toggle = () => screen.getByRole("switch", { name: "Subscribe to this item" });

describe("SubscribeCard", () => {
  it("starts off, offering what she would pay for the quantity", () => {
    show({ quantity: 2 });
    expect(toggle()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("and pay ₦9,000")).toBeInTheDocument();
    expect(screen.getByText(/Never run out or come back to reorder/)).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("just says Subscribe when subscribing costs no less", () => {
    show({ subscriptionPrice: null });
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
    expect(screen.queryByText(/and pay/)).not.toBeInTheDocument();
  });

  it("switching on starts at how long one lasts, and opens the picker under its label", () => {
    const onChange = show({ recommendedFrequencyWeeks: 3, quantity: 2 });
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 6 } });
    expect(toggle()).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Renewal frequency")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Renewal frequency" })).toBeInTheDocument();
  });

  it("with no idea how long it lasts, starts at every 4 weeks", () => {
    const onChange = show({ recommendedFrequencyWeeks: null });
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 4 } });
  });

  it("switching off goes back to a one-time purchase", () => {
    const onChange = show({ value: { frequency: { kind: "weeks", every: 4 } } });
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("changing how often keeps it weekly and keeps a first day she chose", () => {
    const onChange = show({ value: { frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" } });
    fireEvent.click(screen.getByRole("button", { name: "More weeks" }));
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 5 }, firstDate: "2026-12-01" });
  });

  it("going monthly drops the first day (it only applies to weeks) and hides the row", () => {
    const onChange = show({ value: { frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" } });
    fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular date" }));
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "month_date", day: 25 } });
    expect(screen.queryByText("First renewal")).not.toBeInTheDocument();
  });

  it("from the shop, asks no first renewal day: it counts from delivery", () => {
    show({ value: { frequency: { kind: "weeks", every: 4 } } });
    expect(screen.queryByText("First renewal")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pick a day" })).not.toBeInTheDocument();
  });

  it("asks nothing about whether monthly will last, whatever the pack", () => {
    show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 3 });
    expect(screen.queryByText(/Sure this will last a month/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains how it works in place, when asked", () => {
    show();
    expect(screen.queryByText("How Subscribe works")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(screen.getByText("How Subscribe works")).toBeInTheDocument();
    expect(screen.getByText("You pay when you are ready")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(screen.queryByText("How Subscribe works")).not.toBeInTheDocument();
  });
});

describe("startingChoice", () => {
  it("is how long it lasts, else every 4 weeks", () => {
    expect(startingChoice(2, 3)).toEqual({ frequency: { kind: "weeks", every: 6 } });
    expect(startingChoice(null, 3)).toEqual({ frequency: { kind: "weeks", every: 4 } });
  });
});
