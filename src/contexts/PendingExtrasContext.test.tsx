import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { PendingExtrasProvider, usePendingExtras } from "./PendingExtrasContext";

const wrapper = ({ children }: { children: ReactNode }) => <PendingExtrasProvider>{children}</PendingExtrasProvider>;
const wipes = { variantId: "v1", productName: "Baby wipes", brand: "Pampers", variantLabel: "80 sheets", unitPriceKobo: 240_000 };
const cream = { variantId: "v2", productName: "Nappy cream", brand: "Sudocrem", variantLabel: null, unitPriceKobo: 310_000 };

beforeEach(() => sessionStorage.clear());

describe("PendingExtrasContext", () => {
  it("starts out shopping normally", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    expect(result.current).toMatchObject({ boxId: null, picks: [], count: 0 });
  });

  it("outside a provider it is inert: nothing to add to, and nothing it does throws", () => {
    const { result } = renderHook(() => usePendingExtras());
    expect(result.current.boxId).toBeNull();
    expect(() => act(() => result.current.add(wipes, 1))).not.toThrow();
    expect(result.current.picks).toEqual([]);
  });

  it("adds only once she has started shopping for an order", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.add(wipes, 1));
    expect(result.current.picks).toEqual([]);
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 2));
    expect(result.current.boxId).toBe("box-1");
    expect(result.current.picks).toEqual([{ ...wipes, quantity: 2 }]);
  });

  it("adding the same thing again adds to how many", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 2));
    act(() => result.current.add(wipes, 1));
    act(() => result.current.add(cream, 1));
    expect(result.current.picks.map((p) => [p.variantId, p.quantity])).toEqual([["v1", 3], ["v2", 1]]);
    expect(result.current.count).toBe(4);
  });

  it("ignores a quantity that is not a whole number of at least one", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 0));
    act(() => result.current.add(wipes, -1));
    act(() => result.current.add(wipes, 1.5));
    expect(result.current.picks).toEqual([]);
  });

  it("sets how many, and 0 takes it out", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 2));
    act(() => result.current.setQuantity("v1", 5));
    expect(result.current.picks[0].quantity).toBe(5);
    act(() => result.current.setQuantity("v1", 0));
    expect(result.current.picks).toEqual([]);
  });

  it("starting for the same order keeps the picks; for another order forgets them", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 2));
    act(() => result.current.start("box-1"));
    expect(result.current.count).toBe(2);
    act(() => result.current.start("box-2"));
    expect(result.current).toMatchObject({ boxId: "box-2", picks: [], count: 0 });
  });

  it("cancel forgets everything and goes back to shopping normally", () => {
    const { result } = renderHook(() => usePendingExtras(), { wrapper });
    act(() => result.current.start("box-1"));
    act(() => result.current.add(wipes, 2));
    act(() => result.current.cancel());
    expect(result.current).toMatchObject({ boxId: null, picks: [], count: 0 });
  });

  it("survives a refresh within the visit, and is gone after cancel", () => {
    const first = renderHook(() => usePendingExtras(), { wrapper });
    act(() => first.result.current.start("box-1"));
    act(() => first.result.current.add(wipes, 2));
    first.unmount();
    const again = renderHook(() => usePendingExtras(), { wrapper });
    expect(again.result.current).toMatchObject({ boxId: "box-1", count: 2 });
    act(() => again.result.current.cancel());
    again.unmount();
    expect(renderHook(() => usePendingExtras(), { wrapper }).result.current.boxId).toBeNull();
  });

  it("starts clean when what was saved is not what we wrote", () => {
    sessionStorage.setItem("nesta_pending_extras", "{not json");
    expect(renderHook(() => usePendingExtras(), { wrapper }).result.current.boxId).toBeNull();
    sessionStorage.setItem("nesta_pending_extras", JSON.stringify({ boxId: 5, picks: "x" }));
    expect(renderHook(() => usePendingExtras(), { wrapper }).result.current.boxId).toBeNull();
    sessionStorage.setItem("nesta_pending_extras", JSON.stringify({ boxId: "b", picks: [{ variantId: "v", quantity: 0 }, null, { variantId: "w", quantity: 2 }] }));
    expect(renderHook(() => usePendingExtras(), { wrapper }).result.current.picks.map((p) => p.variantId)).toEqual(["w"]);
  });
});
