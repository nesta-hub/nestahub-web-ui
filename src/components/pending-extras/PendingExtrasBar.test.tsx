import { useLayoutEffect, useRef } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingExtrasProvider, usePendingExtras, type PendingExtra } from "@/contexts/PendingExtrasContext";
import { BOX_CODES, BoxApiError, clearBoxToken, setBoxToken, type Box } from "@/lib/subscriptionBoxes";
import { PendingExtrasBar } from "./PendingExtrasBar";

// ---- what the bar talks to ------------------------------------------------------------------
const api = vi.hoisted(() => ({ mine: vi.fn(), setExtras: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({ ...(await original<typeof import("@/lib/subscriptionBoxes")>()), subscriptionBoxesApi: api }));

// The one switch for the new Subscribe experience. Off unless a test turns it on.
const subscribeOn = vi.hoisted(() => vi.fn(() => true));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => subscribeOn(), resetSubscribeEnabled: vi.fn() }));

const auth = vi.hoisted(() => ({ value: { session: { access_token: "tok" } as { access_token: string } | null, user: { id: "u1" } as { id: string } | null } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { toast } from "sonner";

// ---- fixtures -------------------------------------------------------------------------------
const subscriptionLine = (over = {}) => ({
  id: "l1", subscriptionId: "s1", variantId: "v-diapers", productName: "Kisskids Diapers", brand: "Kisskids", variantLabel: "Size 3",
  imageUrl: null, quantity: 2, unitPriceKobo: 450_000, lineTotalKobo: 900_000, dueDate: "2026-11-25", kind: "subscription" as const, ...over,
});
/** An extra she already added to this order earlier. */
const extraLine = (over = {}) => ({ ...subscriptionLine(), id: "x1", subscriptionId: null, variantId: "v-wipes", productName: "Baby wipes", variantLabel: "80 sheets", quantity: 3, unitPriceKobo: 240_000, lineTotalKobo: 720_000, dueDate: null, kind: "one_time" as const, ...over });
const box = (over: Partial<Box> = {}): Box => ({
  id: "b1", status: "scheduled", deliveryDate: "2026-11-24", confirmBy: "2026-11-23T15:00:00.000Z", late: false, version: 1, editable: true,
  delivery: { type: "community", zoneName: "Gbagada", address: "12 Soluyi Road", lat: 6.55, lng: 3.38, pickupStationId: null, pickupStationName: null },
  needsDelivery: false, items: [subscriptionLine()], subtotalKobo: 900_000, deliveryFeeKobo: 50_000, totalKobo: 950_000, order: null, canPay: true, canUndoSkip: false, openDays: [],
  ...over,
});
const tab = (boxes: Box[] = [box()]) => ({ boxes, items: [], defaultDelivery: null });

type Pick = Omit<PendingExtra, "quantity"> & { quantity: number };
const wipes: Pick = { variantId: "v-wipes", productName: "Baby wipes", brand: "Pampers", variantLabel: "80 sheets", unitPriceKobo: 240_000, quantity: 2 };
const cream: Pick = { variantId: "v-cream", productName: "Nappy cream", brand: "Sudocrem", variantLabel: null, unitPriceKobo: 310_000, quantity: 1 };

// ---- the stage ------------------------------------------------------------------------------
/** Starts her shopping for an order with these picks, the way the Add extra items button and the product page do. */
function Seed({ boxId, picks }: { boxId: string | null; picks: Pick[] }) {
  const pending = usePendingExtras();
  const done = useRef(false);
  useLayoutEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!boxId) return;
    pending.start(boxId);
    picks.forEach(({ quantity, ...rest }) => pending.add(rest, quantity));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Shows what the app would know: where she is, and what she is shopping for. */
function Probe() {
  const { boxId, count, picks } = usePendingExtras();
  const { pathname } = useLocation();
  return (
    <output>
      <span>at:{pathname}</span> <span>for:{boxId ?? "nothing"}</span> <span>count:{count}</span> <span>picks:{picks.map((p) => `${p.variantId}x${p.quantity}`).join(",") || "none"}</span>
    </output>
  );
}

function show({ at = "/shop", boxId = "b1" as string | null, picks = [wipes, cream] as Pick[] } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[at]}>
        <PendingExtrasProvider>
          <Seed boxId={boxId} picks={picks} />
          <PendingExtrasBar />
          <Probe />
        </PendingExtrasProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { invalidate, unmount: view.unmount };
}

const bar = () => screen.queryByRole("region", { name: "Adding extra items", hidden: true });
// Read straight from the page: an open drawer hides everything behind it from the role queries.
const probeText = () => document.querySelector("output")?.textContent ?? "";
// A closed drawer stays in the page while it animates away (it never finishes in jsdom): "closed" is what it says.
const drawerClosed = () => document.querySelector('[role="dialog"]')?.getAttribute("data-state") === "closed";
const review = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /^Proceed/ }));
  return within(await screen.findByRole("dialog"));
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  clearBoxToken();
  subscribeOn.mockReturnValue(true);
  auth.value = { session: { access_token: "tok" }, user: { id: "u1" } };
  api.mine.mockResolvedValue(tab());
  api.setExtras.mockResolvedValue({ version: 2 });
});

// ---- when it shows --------------------------------------------------------------------------
describe("when the bars show", () => {
  it("shows over the shop while she is adding to an order", async () => {
    show();
    expect(await screen.findByRole("region", { name: "Adding extra items" })).toBeInTheDocument();
    expect(api.mine).toHaveBeenCalled();
  });

  it.each(["/shop", "/shop/baby-care", "/shop/baby-care/body-wash", "/catalogue", "/catalogue/some-product"])("shows at %s", async (at) => {
    show({ at });
    expect(await screen.findByRole("region", { name: "Adding extra items" })).toBeInTheDocument();
  });

  it.each(["/subscriptions", "/cart", "/checkout", "/account", "/gifting", "/shopping"])("does not show at %s, and asks for nothing", async (at) => {
    show({ at });
    await new Promise((r) => setTimeout(r, 20));
    expect(bar()).toBeNull();
    expect(api.mine).not.toHaveBeenCalled();
  });

  it("does not show while the new experience is off", async () => {
    subscribeOn.mockReturnValue(false);
    show();
    await new Promise((r) => setTimeout(r, 20));
    expect(bar()).toBeNull();
    expect(api.mine).not.toHaveBeenCalled();
  });

  it("does not show when she is not adding to an order", async () => {
    show({ boxId: null });
    await new Promise((r) => setTimeout(r, 20));
    expect(bar()).toBeNull();
    expect(api.mine).not.toHaveBeenCalled();
  });
});

// ---- the bar over the top: the design's mode bar --------------------------------------------
describe("the bar over the top of the shop", () => {
  it("says what she is doing, and for which order and where it goes", async () => {
    show({ picks: [] });
    const modeBar = within(await screen.findByRole("region", { name: "Adding extra items" }));
    expect(modeBar.getByText("Adding to your pending order")).toBeInTheDocument();
    expect(await modeBar.findByText("For Tue 24 Nov · 12 Soluyi Road")).toBeInTheDocument();
  });

  it("counts what she has added, in words: '3 extra items added', '1 extra item added'", async () => {
    show();
    expect(await screen.findByText("3 extra items added")).toBeInTheDocument();
  });

  it("says '1 extra item added' for one", async () => {
    show({ picks: [{ ...cream, quantity: 1 }] });
    expect(await screen.findByText("1 extra item added")).toBeInTheDocument();
  });

  it("says 'For your next order' until it has found out which order it is", async () => {
    api.mine.mockReturnValue(new Promise(() => undefined));
    show();
    expect(await screen.findByText("For your next order")).toBeInTheDocument();
  });

  it("is fixed to the top, under the desktop header on a wide screen, and the page leaves room for it", async () => {
    const { unmount } = show();
    const modeBar = await screen.findByRole("region", { name: "Adding extra items" });
    expect(modeBar).toHaveClass("fixed", "top-0", "md:top-20", "h-[84px]", "rounded-b-[26px]", "bg-[#DDE3DA]");
    expect(document.body.style.paddingTop).toBe("84px");
    expect(document.documentElement.style.getPropertyValue("--pending-bar-h")).toBe("84px");
    unmount();
    expect(document.body.style.paddingTop).toBe("");
    expect(document.documentElement.style.getPropertyValue("--pending-bar-h")).toBe("");
  });

  it("has a close button, and no Review or Cancel button of its own", async () => {
    show({ picks: [] });
    const modeBar = within(await screen.findByRole("region", { name: "Adding extra items" }));
    expect(modeBar.getByRole("button", { name: "Close and go back to your order" })).toBeInTheDocument();
    expect(modeBar.queryByRole("button", { name: /Review|Cancel/ })).toBeNull();
  });
});

// ---- Close ----------------------------------------------------------------------------------
describe("Close", () => {
  it("leaves the mode, forgets what she picked, and goes back to her order", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Close and go back to your order" }));
    await waitFor(() => expect(probeText()).toContain("at:/subscriptions"));
    expect(probeText()).toContain("for:nothing");
    expect(probeText()).toContain("count:0");
    expect(bar()).toBeNull();
    expect(api.setExtras).not.toHaveBeenCalled();
  });

  it("sends someone who came by a link in a message back by that link", async () => {
    auth.value = { session: null, user: null };
    setBoxToken("link-token-9");
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Close and go back to your order" }));
    await waitFor(() => expect(probeText()).toContain("at:/subscriptions/open/link-token-9"));
  });
});

// ---- the bar at the bottom: Proceed ---------------------------------------------------------
describe("the Proceed bar", () => {
  it("is not there until she has picked something", async () => {
    show({ picks: [] });
    await screen.findByRole("region", { name: "Adding extra items" });
    expect(screen.queryByRole("region", { name: "Your extra items" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Proceed/ })).toBeNull();
  });

  it("says Proceed with what her extras come to, and sits at the bottom of the screen", async () => {
    show();
    const proceed = await screen.findByRole("region", { name: "Your extra items" });
    expect(proceed).toHaveClass("fixed", "bottom-0", "h-[100px]");
    expect(within(proceed).getByRole("button", { name: /^Proceed/ })).toHaveTextContent("Proceed₦7,900"); // 2 x ₦2,400 + ₦3,100
    expect(document.body.style.paddingBottom).toBe("100px");
  });

  it("is in the Nesta Hub brown", async () => {
    show();
    expect(await screen.findByRole("button", { name: /^Proceed/ })).toHaveClass("bg-shop-cta");
  });

  it("opens the Confirm extra items sheet", async () => {
    show();
    const sheet = await review();
    expect(sheet.getByRole("heading", { name: "Confirm extra items" })).toBeInTheDocument();
  });

  it("waits until it knows the order before it can be pressed", async () => {
    api.mine.mockReturnValue(new Promise(() => undefined));
    show();
    expect(await screen.findByRole("button", { name: /^Proceed/ })).toBeDisabled();
  });

  it("keeps her picks when it cannot find out about the order", async () => {
    api.mine.mockRejectedValue(new Error("down"));
    show();
    await waitFor(() => expect(api.mine).toHaveBeenCalled());
    expect(bar()).not.toBeNull();
    expect(probeText()).toContain("count:3");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("leaves the page its own bottom room again when she has nothing picked", async () => {
    show({ picks: [] });
    await screen.findByRole("region", { name: "Adding extra items" });
    expect(document.body.style.paddingBottom).toBe("");
  });
});

// ---- when the order can no longer be changed ------------------------------------------------
describe("when the order can no longer be changed", () => {
  it("lets go of it, with a message, when she has paid", async () => {
    api.mine.mockResolvedValue(tab([box({ editable: false, status: "paid" })]));
    show();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("That order can no longer be changed"));
    expect(probeText()).toContain("for:nothing");
    expect(bar()).toBeNull();
  });

  it("lets go of it when the order is gone", async () => {
    api.mine.mockResolvedValue(tab([box({ id: "someone-else" })]));
    show();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("That order can no longer be changed"));
    expect(probeText()).toContain("for:nothing");
  });

  it("does not let go of it while it is still finding out", async () => {
    api.mine.mockReturnValue(new Promise(() => undefined));
    show();
    await screen.findByRole("region", { name: "Adding extra items" });
    expect(toast.error).not.toHaveBeenCalled();
    expect(probeText()).toContain("for:b1");
  });
});

// ---- Confirm extra items --------------------------------------------------------------------
describe("Confirm extra items", () => {
  it("lists what she picked, one line each: the size and how many, and what it comes to", async () => {
    const sheet = await (async () => {
      show();
      return review();
    })();
    const rows = within(sheet.getByRole("list", { name: "Extra items you picked" })).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Baby wipes")).toBeInTheDocument();
    expect(within(rows[0]).getByText("80 sheets · ×2 · ₦4,800")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Nappy cream")).toBeInTheDocument();
    expect(within(rows[1]).getByText("₦3,100")).toBeInTheDocument(); // one, and no size: just the price
  });

  it("shows the extras total and the whole order's total with them in", async () => {
    show();
    const sheet = await review();
    expect(sheet.getByText("Extra items total")).toBeInTheDocument();
    expect(sheet.getByText("₦7,900")).toBeInTheDocument();
    expect(sheet.getByText("Pending order total")).toBeInTheDocument();
    expect(sheet.getByText("₦17,400")).toBeInTheDocument(); // ₦9,500 order + ₦7,900 extras
  });

  it("leaves out the order's total while it cannot be worked out", async () => {
    api.mine.mockResolvedValue(tab([box({ totalKobo: null, deliveryFeeKobo: null })]));
    show();
    const sheet = await review();
    expect(sheet.getByText("Extra items total")).toBeInTheDocument();
    expect(sheet.queryByText("Pending order total")).toBeNull();
  });

  it("has a Remove for each, and nothing to make anything bigger", async () => {
    show();
    const sheet = await review();
    expect(sheet.getAllByRole("button", { name: /^Remove / })).toHaveLength(2);
    expect(sheet.queryByRole("button", { name: /More|Fewer/ })).toBeNull();
    expect(sheet.queryByText("Keep shopping")).toBeNull();
  });

  it("has no X and no back arrow, and ends in a Complete button in the Nesta Hub brown", async () => {
    show();
    const sheet = await review();
    expect(sheet.queryByRole("button", { name: /close|back/i })).toBeNull();
    expect(sheet.getByRole("button", { name: "Complete" })).toHaveClass("bg-shop-cta");
  });

  it("takes an item out with Remove, and the totals follow", async () => {
    show();
    const sheet = await review();
    fireEvent.click(sheet.getByRole("button", { name: "Remove Nappy cream" }));
    expect(sheet.queryByText("Nappy cream")).toBeNull();
    expect(sheet.getByText("Extra items total").nextSibling).toHaveTextContent("₦4,800");
    expect(probeText()).toContain("picks:v-wipesx2");
  });

  it("closes when the last one is taken out, and she is still shopping", async () => {
    show({ picks: [{ ...cream, quantity: 1 }] });
    const sheet = await review();
    fireEvent.click(sheet.getByRole("button", { name: "Remove Nappy cream" }));
    await waitFor(() => expect(drawerClosed()).toBe(true));
    expect(probeText()).toContain("for:b1");
    expect(probeText()).toContain("count:0");
    expect(await screen.findByText("Adding to your pending order")).toBeInTheDocument();
  });

  it("closes with a tap outside, keeping her picks", async () => {
    show();
    await review();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(drawerClosed()).toBe(true));
    expect(probeText()).toContain("count:3");
    expect(probeText()).toContain("for:b1");
  });

  it("opens again with the same picks", async () => {
    show();
    await review();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(drawerClosed()).toBe(true));
    // The closed drawer keeps the page hidden from role queries while it animates away (it never finishes in jsdom).
    fireEvent.click(screen.getByRole("button", { name: /^Proceed/, hidden: true }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')?.getAttribute("data-state")).toBe("open"));
    expect(within(document.querySelector('[role="dialog"]') as HTMLElement).getAllByRole("button", { name: /^Remove / })).toHaveLength(2);
  });
});

describe("completing", () => {
  it("sends how many of each she picked", async () => {
    show();
    fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
    await waitFor(() => expect(api.setExtras).toHaveBeenCalledTimes(1));
    expect(api.setExtras).toHaveBeenCalledWith("tok", "b1", [
      { variantId: "v-wipes", quantity: 2 },
      { variantId: "v-cream", quantity: 1 },
    ]);
  });

  it("adds what is already in the order to what she picked, so she does not lose it", async () => {
    api.mine.mockResolvedValue(tab([box({ items: [subscriptionLine(), extraLine({ quantity: 3 })] })]));
    show();
    const sheet = await review();
    fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
    await waitFor(() => expect(api.setExtras).toHaveBeenCalledTimes(1));
    expect(api.setExtras).toHaveBeenCalledWith("tok", "b1", [
      { variantId: "v-wipes", quantity: 5 }, // 3 there + 2 picked
      { variantId: "v-cream", quantity: 1 },
    ]);
  });

  it("only counts extras already in the order, not a subscription item that is the same product", async () => {
    api.mine.mockResolvedValue(tab([box({ items: [subscriptionLine({ variantId: "v-wipes", productName: "Baby wipes", quantity: 4 })] })]));
    show();
    fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
    await waitFor(() => expect(api.setExtras).toHaveBeenCalled());
    expect(api.setExtras).toHaveBeenCalledWith("tok", "b1", [
      { variantId: "v-wipes", quantity: 2 },
      { variantId: "v-cream", quantity: 1 },
    ]);
  });

  it("never asks for more than 20 of one thing", async () => {
    api.mine.mockResolvedValue(tab([box({ items: [subscriptionLine(), extraLine({ quantity: 19 })] })]));
    show();
    fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
    await waitFor(() => expect(api.setExtras).toHaveBeenCalled());
    expect(api.setExtras).toHaveBeenCalledWith("tok", "b1", [
      { variantId: "v-wipes", quantity: 20 }, // 19 there + 2 picked, held at 20
      { variantId: "v-cream", quantity: 1 },
    ]);
  });

  it("shows it is sending, and sends once however many times she taps", async () => {
    let finish: (v: unknown) => void = () => undefined;
    api.setExtras.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    show();
    const sheet = await review();
    fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
    const busy = await sheet.findByRole("button", { name: "One moment…" });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(api.setExtras).toHaveBeenCalledTimes(1);
    finish({ version: 2 });
    await waitFor(() => expect(probeText()).toContain("for:nothing"));
  });

  describe("when it works", () => {
    it("clears what she was doing, says so, and goes back to her subscription", async () => {
      const { invalidate } = show();
      fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added to your order"));
      expect(probeText()).toContain("for:nothing");
      expect(probeText()).toContain("count:0");
      expect(probeText()).toContain("at:/subscriptions");
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscription-tab"] });
      expect(bar()).toBeNull();
    });

    it("someone who came by a link in a message goes back to the page that link opens", async () => {
      auth.value = { session: null, user: null };
      setBoxToken("link-token-9");
      show();
      fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(probeText()).toContain("at:/subscriptions/open/link-token-9"));
      expect(api.setExtras).toHaveBeenCalledWith(null, "b1", expect.any(Array));
      expect(toast.success).toHaveBeenCalledWith("Added to your order");
      expect(probeText()).toContain("for:nothing");
    });

    it("someone signed in goes to /subscriptions even if a link token is still kept from earlier", async () => {
      setBoxToken("link-token-9");
      show();
      fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(probeText()).toContain("at:/subscriptions"));
      expect(probeText()).not.toContain("/open/");
    });
  });

  describe("when it does not work", () => {
    it.each([
      ["the order can no longer be changed", BOX_CODES.notEditable],
      ["payment has started", BOX_CODES.paymentStarted],
    ])("says so and goes back to her subscription when %s", async (_what, code) => {
      api.setExtras.mockRejectedValue(new BoxApiError("This box can no longer be changed", 409, code));
      const { invalidate } = show();
      fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This order can no longer be changed"));
      expect(probeText()).toContain("for:nothing");
      expect(probeText()).toContain("at:/subscriptions");
      expect(toast.success).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscription-tab"] });
    });

    it("a link-holder is sent back by their link when the order can no longer be changed", async () => {
      auth.value = { session: null, user: null };
      setBoxToken("link-token-9");
      api.setExtras.mockRejectedValue(new BoxApiError("nope", 409, BOX_CODES.paymentStarted));
      show();
      fireEvent.click((await review()).getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(probeText()).toContain("at:/subscriptions/open/link-token-9"));
    });

    it("takes out an item that is no longer on sale, keeps the rest, and stays open", async () => {
      api.setExtras.mockRejectedValue(new BoxApiError("An item you chose is no longer available", 409, BOX_CODES.extraNotAvailable, { variantIds: ["v-cream"] }));
      show();
      const sheet = await review();
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      expect(await sheet.findByText("1 item is no longer available and was taken out")).toBeInTheDocument();
      expect(sheet.queryByText("Nappy cream")).toBeNull();
      expect(sheet.getByText("Baby wipes")).toBeInTheDocument();
      expect(sheet.getByText("Extra items total").nextSibling).toHaveTextContent("₦4,800");
      expect(probeText()).toContain("picks:v-wipesx2");
      expect(probeText()).toContain("for:b1");
      expect(probeText()).toContain("at:/shop");
      // the button is usable again, and the next try sends only what is left
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(api.setExtras).toHaveBeenCalledTimes(2));
      expect(api.setExtras).toHaveBeenLastCalledWith("tok", "b1", [{ variantId: "v-wipes", quantity: 2 }]);
    });

    it("says how many items were taken out when it is more than one", async () => {
      api.setExtras.mockRejectedValue(new BoxApiError("gone", 409, BOX_CODES.extraNotAvailable, { variantIds: ["v-cream", "v-wipes"] }));
      show();
      const sheet = await review();
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      expect(await sheet.findByText("2 items are no longer available and were taken out")).toBeInTheDocument();
      expect(sheet.getByText("Nothing picked yet.")).toBeInTheDocument();
      expect(sheet.getByRole("button", { name: "Complete" })).toBeDisabled();
    });

    it("shows the error's own words inside the sheet, and the button works again", async () => {
      api.setExtras.mockRejectedValue(new BoxApiError("You can add up to 30 different extras", 400));
      show();
      const sheet = await review();
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      expect(await sheet.findByRole("alert")).toHaveTextContent("You can add up to 30 different extras");
      expect(sheet.getByRole("button", { name: "Complete" })).toBeEnabled();
      expect(probeText()).toContain("count:3"); // nothing lost
      expect(probeText()).toContain("for:b1");
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("says something plain, and unsticks the button, when the call fails some other way", async () => {
      api.setExtras.mockRejectedValue(new TypeError("Failed to fetch"));
      show();
      const sheet = await review();
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      expect(await sheet.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
      expect(sheet.getByRole("button", { name: "Complete" })).toBeEnabled();
    });

    it("clears an old message when she tries again", async () => {
      api.setExtras.mockRejectedValueOnce(new BoxApiError("Something odd", 500)).mockResolvedValueOnce({ version: 2 });
      show();
      const sheet = await review();
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      expect(await sheet.findByRole("alert")).toHaveTextContent("Something odd");
      fireEvent.click(sheet.getByRole("button", { name: "Complete" }));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added to your order"));
      expect(probeText()).toContain("at:/subscriptions");
    });
  });
});
