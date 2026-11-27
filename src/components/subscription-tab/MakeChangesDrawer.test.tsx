import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { Box } from "@/lib/subscriptionBoxes";
import { MakeChangesDrawer } from "./MakeChangesDrawer";

vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  getPickupStations: async () => [
    { id: "p1", name: "Gbagada station", address: "4 Diya St", dayOfWeek: "Tuesdays", subscriptionDays: [2], hours: "10am to 4pm", phoneNumber: "", isActive: true, sortOrder: 1 },
  ],
}));
vi.mock("@/components/checkout/CheckoutAddressSection", () => ({ CheckoutAddressSection: () => <div /> }));

const box = (over: Partial<Box> = {}): Box => ({
  id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
  delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
  needsDelivery: false,
  items: [
    { id: "l1", subscriptionId: "s1", variantId: "v1", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3", imageUrl: null, quantity: 2, unitPriceKobo: 450_000, lineTotalKobo: 900_000, dueDate: "2026-11-25", kind: "subscription" },
  ],
  subtotalKobo: 900_000, deliveryFeeKobo: 50_000, totalKobo: 950_000, order: null, canPay: true, canUndoSkip: false,
  openDays: [{ date: "2026-11-28" }],
  ...over,
} as Box);

function drawer(startOn?: "menu" | "date" | "location") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MakeChangesDrawer
        box={box()}
        open
        startOn={startOn}
        busy={false}
        onClose={vi.fn()}
        onLeaveOut={vi.fn()}
        onRemoveExtra={vi.fn()}
        onMoveDay={vi.fn()}
        onChangeLocation={vi.fn()}
        loadDeliveryOptions={vi.fn().mockResolvedValue({ community: { feeKobo: 50_000 }, instant: { feeKobo: 150_000 } })}
      />
    </QueryClientProvider>,
  );
  return within(screen.getByRole("dialog"));
}

describe("the Make changes drawer, drawn as the design has it", () => {
  it("has no Save button on the menu, and no close button anywhere", () => {
    const sheet = drawer();
    expect(sheet.queryByRole("button", { name: "Save" })).toBeNull();
    expect(sheet.queryByRole("button", { name: /close/i })).toBeNull();
  });

  it("marks the picked day the way the design does: light brown, not bold", () => {
    const sheet = drawer("date");
    const picked = sheet.getByRole("button", { name: "Tue 24 Nov", pressed: true });
    const other = sheet.getByRole("button", { name: "Sat 28 Nov", pressed: false });
    expect(picked.className).toContain("border-[#A08B76]");
    expect(picked.className).toContain("text-[#A08B76]");
    expect(picked.className).toContain("font-medium");
    expect(picked.className).not.toContain("font-bold");
    expect(other.className).toContain("border-[#E5E0DC]");
    expect(other.className).toContain("font-medium");
  });

  it("offers the methods as pills, and her address as a picked radio row with 'Change address' under it", async () => {
    const sheet = drawer("location");
    expect(sheet.getAllByRole("button", { pressed: true }).map((b) => b.textContent?.split(" · ")[0])).toEqual(["Community Delivery"]);
    expect(sheet.getByRole("button", { name: /^Instant Delivery/, pressed: false })).toBeInTheDocument();
    expect(sheet.getByRole("button", { name: /^Pick-up/, pressed: false })).toBeInTheDocument();
    expect(sheet.getByText("12 Soluyi Road")).toBeInTheDocument();
    expect(sheet.getByRole("button", { name: "Change address" })).toBeInTheDocument();
    expect(sheet.queryByText(/^Now:/)).toBeNull();
  });

  it("lists the pick-up stations with their address and their day and hours", async () => {
    const sheet = drawer("location");
    fireEvent.click(sheet.getByRole("button", { name: /^Pick-up/ }));
    expect(await sheet.findByText("Gbagada station")).toBeInTheDocument();
    expect(sheet.getByText("4 Diya St")).toBeInTheDocument();
    expect(sheet.getByText("Tuesdays · 10am to 4pm")).toBeInTheDocument();
  });
});
