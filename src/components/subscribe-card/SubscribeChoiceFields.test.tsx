import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SubscribeChoice } from "./choice";
import { SubscribeChoiceFields } from "./SubscribeChoiceFields";

const NOW = new Date("2026-11-15T09:00:00.000Z"); // Sun 15 Nov, Lagos

/** The fields as "Subscribe to something else" and the setup page use them: with the first renewal day. */
function show(start: SubscribeChoice, showFirstRenewal?: boolean) {
  const onChange = vi.fn();
  function Host() {
    const [value, setValue] = useState(start);
    return (
      <SubscribeChoiceFields
        value={value}
        now={NOW}
        showFirstRenewal={showFirstRenewal}
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
const weekly = { frequency: { kind: "weeks", every: 4 } } as SubscribeChoice;

describe("the first renewal day (weekly)", () => {
  it("says it counts from arrival until she picks a day", () => {
    show(weekly);
    expect(screen.getByText("First renewal")).toBeInTheDocument();
    expect(screen.getByText("4 weeks after it arrives")).toBeInTheDocument();
  });

  it("says a week, not 1 weeks", () => {
    show({ frequency: { kind: "weeks", every: 1 } });
    expect(screen.getByText("A week after it arrives")).toBeInTheDocument();
  });

  it("picking a day stores it, and shows it", () => {
    const onChange = show(weekly);
    fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
    fireEvent.change(screen.getByLabelText("Day of the first renewal"), { target: { value: "2026-12-01" } });
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" });
    expect(screen.getByText("Tue 1 Dec")).toBeInTheDocument();
  });

  it("allows tomorrow to 26 weeks ahead, and no other day", () => {
    show(weekly);
    fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
    const input = screen.getByLabelText("Day of the first renewal");
    expect(input).toHaveAttribute("min", "2026-11-16");
    expect(input).toHaveAttribute("max", "2027-05-16");
  });

  it.each(["2026-11-15", "2027-05-17", "2026-02-31"])("ignores %s", (day) => {
    const onChange = show(weekly);
    fireEvent.click(screen.getByRole("button", { name: "Pick a day" }));
    onChange.mockClear();
    fireEvent.change(screen.getByLabelText("Day of the first renewal"), { target: { value: day } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clearing goes back to counting from arrival", () => {
    const onChange = show({ frequency: { kind: "weeks", every: 4 }, firstDate: "2026-12-01" });
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "weeks", every: 4 } });
    expect(screen.getByText("4 weeks after it arrives")).toBeInTheDocument();
  });

  it("is not there for a monthly choice", () => {
    show({ frequency: { kind: "month_date", day: 25 } });
    expect(screen.queryByText("First renewal")).not.toBeInTheDocument();
  });

  it("is left out when the screen asks (the shop's product pages)", () => {
    show(weekly, false);
    expect(screen.queryByText("First renewal")).not.toBeInTheDocument();
  });
});

describe("the first order day (subscribing without buying it first)", () => {
  function showFirstOrder(start: SubscribeChoice) {
    const onChange = vi.fn();
    function Host() {
      const [value, setValue] = useState(start);
      return (
        <SubscribeChoiceFields
          value={value}
          now={NOW}
          firstOrder
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

  it("is one cycle from today until she changes it: every 4 weeks is four weeks from today", () => {
    showFirstOrder(weekly);
    expect(screen.getByText("First order")).toBeInTheDocument();
    expect(screen.getByText("Sun 13 Dec")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change date" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pick a day" })).toBeNull();
  });

  it("follows the frequency: the 25th is the next 25th at least a week away, the last Friday the next one", () => {
    showFirstOrder({ frequency: { kind: "month_date", day: 25 } });
    expect(screen.getByText("Wed 25 Nov")).toBeInTheDocument();
    cleanup();
    showFirstOrder({ frequency: { kind: "month_date", day: 20 } });
    expect(screen.getByText("Sun 20 Dec")).toBeInTheDocument();
    cleanup();
    showFirstOrder({ frequency: { kind: "month_weekday", nth: -1, weekday: 5 } });
    expect(screen.getByText("Fri 27 Nov")).toBeInTheDocument();
  });

  it("Change date opens on that date, allows today, and the day she picks takes its place with the picker closed", () => {
    const onChange = showFirstOrder({ frequency: { kind: "month_date", day: 25 } });
    fireEvent.click(screen.getByRole("button", { name: "Change date" }));
    const input = screen.getByLabelText("Day of the first order");
    expect(input).toHaveValue("2026-11-25");
    expect(input).toHaveAttribute("min", "2026-11-15");
    fireEvent.change(input, { target: { value: "2026-11-15" } });
    expect(onChange).toHaveBeenLastCalledWith({ frequency: { kind: "month_date", day: 25 }, firstDate: "2026-11-15" });
    expect(screen.getByText("Sun 15 Nov")).toBeInTheDocument();
    expect(screen.queryByLabelText("Day of the first order")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });
});
