import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { startingChoice, type SubscribeChoice } from "./choice";
import { SubscribeCard } from "./SubscribeCard";

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

  describe("the first renewal day (weekly)", () => {
    it("says it counts from arrival until she picks a day", () => {
      show({ value: { frequency: { kind: "weeks", every: 4 } } });
      expect(screen.getByText("First renewal")).toBeInTheDocument();
      expect(screen.getByText("4 weeks after it arrives")).toBeInTheDocument();
    });

    it("says a week, not 1 weeks", () => {
      show({ value: { frequency: { kind: "weeks", every: 1 } } });
      expect(screen.getByText("A week after it arrives")).toBeInTheDocument();
    });

    it("picking a day stores it, and shows it", () => {
      const onChange = show({ value: { frequency: { kind: "weeks", every: 4 } } });
      fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
      fireEvent.change(screen.getByLabelText("Day of the first renewal"), { target: { value: "2026-12-01" } });
      expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" });
      expect(screen.getByText("Tue 1 Dec")).toBeInTheDocument();
    });

    it("allows tomorrow to 26 weeks ahead, and no other day", () => {
      show({ value: { frequency: { kind: "weeks", every: 4 } } });
      fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
      const input = screen.getByLabelText("Day of the first renewal");
      expect(input).toHaveAttribute("min", "2026-11-16");
      expect(input).toHaveAttribute("max", "2027-05-16");
    });

    it.each(["2026-11-15", "2027-05-17", "2026-02-31"])("ignores %s", (day) => {
      const onChange = show({ value: { frequency: { kind: "weeks", every: 4 } } });
      fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
      onChange.mockClear();
      fireEvent.change(screen.getByLabelText("Day of the first renewal"), { target: { value: day } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("clearing goes back to counting from arrival", () => {
      const onChange = show({ value: { frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" } });
      fireEvent.click(screen.getByRole("button", { name: "Change" }));
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 4 } });
      expect(screen.getByText("4 weeks after it arrives")).toBeInTheDocument();
    });
  });

  describe("how often against how long it lasts", () => {
    it("a monthly choice for something that lasts 3 weeks asks if it will last a month", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 3 });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Sure this will last a month? One pack lasts about 21 days, and a month is 30. Every 3 weeks keeps you covered.",
      );
    });

    it("Ignore hides it, until she changes how often", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 3 });
      fireEvent.click(screen.getByRole("button", { name: "Ignore" }));
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Later date" }));
      expect(screen.getByRole("status")).toHaveTextContent("Sure this will last a month?");
    });

    it("going back to weeks takes it away", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 3 });
      fireEvent.click(screen.getByRole("radio", { name: "Every few weeks" }));
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("a monthly choice for something that lasts 8 weeks says there is more than a month", () => {
      show({ value: { frequency: { kind: "month_weekday", nth: 1, weekday: 2 } }, recommendedFrequencyWeeks: 8 });
      expect(screen.getByRole("status")).toHaveTextContent("Sure you need it every month? One pack lasts about 56 days");
    });

    it("monthly for something that lasts a month needs no check", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 4 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("a weekly choice gets no check", () => {
      show({ value: { frequency: { kind: "weeks", every: 2 } }, recommendedFrequencyWeeks: 3 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("counts the quantity: two that last 2 weeks each last 4", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 2, quantity: 2 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("says packs for more than one", () => {
      show({ value: { frequency: { kind: "month_date", day: 25 } }, recommendedFrequencyWeeks: 1, quantity: 2 });
      expect(screen.getByRole("status")).toHaveTextContent("2 packs last about 14 days");
    });
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
