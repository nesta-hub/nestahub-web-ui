import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { SubscribedItem } from "@/lib/subscriptionBoxes";
import { ItemDrawer } from "./ItemDrawer";

// "Monthly, on a particular date" starts on today's date: pin today to Wed 25 Nov so these tests do not depend on
// the day they run. A caller that passes its own moment still gets the real answer.
vi.mock("@/lib/lagosDay", async (original) => {
  const real = await original<typeof import("@/lib/lagosDay")>();
  return { ...real, lagosToday: (now?: Date) => (now ? real.lagosToday(now) : "2026-11-25") };
});


const item = (over: Partial<SubscribedItem> = {}): SubscribedItem => ({
  id: "s1", status: "active", variantId: "jumbo-3", productId: "p1", productName: "Kisskids Superdry baby diaper", brand: "Kisskids", slug: "diapers",
  variantLabel: "Jumbo · Size 3", imageUrl: null, quantity: 2, unitPriceKobo: 450_000, regularPriceKobo: 500_000, subscriptionPriceKobo: 450_000,
  recommendedFrequencyWeeks: null, frequency: { kind: "weeks", every: 4 }, frequencyLabel: "Every 4 weeks", nextDue: "2026-11-25", boxId: null, problem: null, enrolSource: null, ...over,
});

function show(over: Partial<SubscribedItem> = {}, preview: (f: unknown) => Promise<string> = vi.fn().mockResolvedValue("2026-12-08")) {
  const calls = {
    onPreviewFrequency: vi.fn(preview),
    onClose: vi.fn(),
    onQuantity: vi.fn().mockResolvedValue(true),
    onFrequency: vi.fn().mockResolvedValue(true),
    onPause: vi.fn().mockResolvedValue(true),
    onResume: vi.fn().mockResolvedValue(true),
    onStop: vi.fn().mockResolvedValue(true),
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ItemDrawer item={item(over)} open busy={false} onVariant={vi.fn()} {...calls} />
    </QueryClientProvider>,
  );
  return calls;
}
const dialog = () => within(screen.getByRole("dialog"));
const save = () => screen.getByRole("button", { name: "Save" });

describe("Item options", () => {
  it("lists the five options in the design's order, each with what it is now", () => {
    show();
    const rows = dialog().getAllByRole("button").map((b) => b.textContent);
    expect(rows).toEqual(["Change quantity×2", "Change sizeJumbo · Size 3", "Change renewal frequencyEvery 4 weeks", "PauseActive", "Stop subscription"]);
  });

  it("shows the item above the options: its name, and what it is with how many", () => {
    show();
    expect(dialog().getByText("Kisskids Superdry baby diaper", { selector: "span" })).toBeInTheDocument();
    expect(dialog().getByText("Jumbo · Size 3 · ×2")).toBeInTheDocument();
  });

  it("has no close or back button: she taps outside or drags down", () => {
    show();
    expect(dialog().queryByRole("button", { name: /close|back/i })).toBeNull();
  });

  it("a paused item offers Resume", () => {
    show({ status: "paused" });
    expect(dialog().getByRole("button", { name: /Resume/ })).toHaveTextContent("ResumePaused");
  });
});

describe("Change quantity", () => {
  it("steps the number and saves it, with the design's words", async () => {
    const { onQuantity } = show();
    fireEvent.click(screen.getByRole("button", { name: /Change quantity/ }));
    expect(screen.getByText("Change quantity", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("This changes your next order and the ones after it.")).toBeInTheDocument();
    expect(save()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(save()).toBeEnabled();
    fireEvent.click(save());
    await waitFor(() => expect(onQuantity).toHaveBeenCalledWith(3));
  });

  it("cannot go below one", () => {
    show({ quantity: 1 });
    fireEvent.click(screen.getByRole("button", { name: /Change quantity/ }));
    expect(screen.getByRole("button", { name: "Fewer" })).toBeDisabled();
  });
});

describe("Change renewal frequency", () => {
  it("has the Renewal frequency label over the three ways, and no line about the next order", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /Change renewal frequency/ }));
    expect(screen.getByText("Change renewal frequency", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Renewal frequency", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Renewal frequency" })).toBeInTheDocument();
    expect(screen.queryByText("This changes your next order and the ones after it.")).toBeNull();
  });

  it("saves the way she picks", async () => {
    const { onFrequency } = show();
    fireEvent.click(screen.getByRole("button", { name: /Change renewal frequency/ }));
    expect(save()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Monthly, on a particular date" }));
    fireEvent.click(save());
    await waitFor(() => expect(onFrequency).toHaveBeenCalledWith({ kind: "month_date", day: 25 }));
  });
});

describe("Pause an item", () => {
  it("asks first, then pauses; Never mind closes", async () => {
    const { onPause, onClose } = show();
    fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(screen.getByText("Pause Kisskids Superdry baby diaper?")).toBeInTheDocument();
    expect(screen.getByText("We will leave it out of your orders until you resume it.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Never mind" }));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await waitFor(() => expect(onPause).toHaveBeenCalled());
  });

  it("resumes a paused one", async () => {
    const { onResume } = show({ status: "paused" });
    fireEvent.click(screen.getByRole("button", { name: /Resume/ }));
    expect(screen.getByText("Resume Kisskids Superdry baby diaper?")).toBeInTheDocument();
    expect(screen.getByText("It will come back in your next order.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    await waitFor(() => expect(onResume).toHaveBeenCalled());
  });
});

describe("Stop a subscription", () => {
  it("asks first, in red, and Keep it backs out", async () => {
    const { onStop, onClose } = show();
    fireEvent.click(screen.getByRole("button", { name: /Stop subscription/ }));
    expect(screen.getByText("Stop subscribing to Kisskids Superdry baby diaper?")).toBeInTheDocument();
    expect(screen.getByText("It will not come in your next order. You can subscribe again any time.")).toBeInTheDocument();
    const stop = screen.getByRole("button", { name: "Stop subscription" });
    expect(stop).toHaveClass("bg-[#9A4A3A]");
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(stop);
    await waitFor(() => expect(onStop).toHaveBeenCalled());
  });
});

describe("the main buttons", () => {
  it.each([[/Change quantity/, "Save"], [/Change renewal frequency/, "Save"], [/Pause/, "Pause"]])("%s ends with a centred Nesta Hub brown button", (row, name) => {
    show();
    fireEvent.click(screen.getByRole("button", { name: row }));
    const button = screen.getByRole("button", { name });
    expect(button).toHaveClass("justify-center", "bg-shop-cta");
    expect(button).not.toHaveClass("bg-shop-ink");
  });
});

describe("the next date, before she saves a new frequency", () => {
  it("shows the next date as it is, until she changes anything (and asks the server nothing)", () => {
    const calls = show();
    fireEvent.click(dialog().getByRole("button", { name: /Change renewal frequency/ }));
    expect(dialog().getByText("Next: Wed 25 Nov")).toBeInTheDocument();
    expect(calls.onPreviewFrequency).not.toHaveBeenCalled();
  });

  it("shows when the next one would be with what she picked, worked out by the server, before she saves", async () => {
    const calls = show({ frequency: { kind: "month_date", day: 25 }, frequencyLabel: "On the 25th of every month", nextDue: "2026-12-25" });
    fireEvent.click(dialog().getByRole("button", { name: /Change renewal frequency/ }));
    fireEvent.click(dialog().getByRole("radio", { name: "Monthly, on a particular day" }));
    expect(await dialog().findByText("Next: Tue 8 Dec")).toBeInTheDocument();
    expect(calls.onPreviewFrequency).toHaveBeenCalledWith({ kind: "month_weekday", nth: 1, weekday: 1 });
    expect(calls.onFrequency).not.toHaveBeenCalled();
  });

  it("says it is working it out meanwhile, and shows nothing if it cannot", async () => {
    let fail: (e: Error) => void = () => {};
    show({}, () => new Promise((_, reject) => (fail = reject)));
    fireEvent.click(dialog().getByRole("button", { name: /Change renewal frequency/ }));
    fireEvent.click(dialog().getByRole("button", { name: "More weeks" }));
    expect(await dialog().findByText("Working out the next date…")).toBeInTheDocument();
    fail(new Error("offline"));
    await waitFor(() => expect(dialog().queryByText("Working out the next date…")).toBeNull());
    expect(dialog().queryByText(/^Next:/)).toBeNull();
  });
});
