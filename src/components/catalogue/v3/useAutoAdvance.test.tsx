import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoAdvance } from "./useAutoAdvance";

const reducedMotion = (on: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) => ({ matches: on && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null }) as MediaQueryList,
  );

beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("a carousel that moves on its own", () => {
  it("advances on every interval", () => {
    const advance = vi.fn();
    renderHook(() => useAutoAdvance(advance, 1000));

    tick(3500);

    expect(advance).toHaveBeenCalledTimes(3);
  });

  it("stands still while the pointer is over it, and carries on when it leaves", () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useAutoAdvance(advance, 1000));

    act(() => result.current.setHeld(true));
    tick(3000);
    expect(advance).not.toHaveBeenCalled();

    act(() => result.current.setHeld(false));
    tick(1000);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("waits after the shopper moves it themselves", () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useAutoAdvance(advance, 1000));

    act(() => result.current.pauseFor(5000));
    tick(4900);
    expect(advance).not.toHaveBeenCalled(); // still within the pause

    tick(100); // the pause ends at 5s, and the 5s tick moves it
    expect(advance).toHaveBeenCalledTimes(1);

    tick(1000); // and it carries on from there
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it("never moves for someone who asked for reduced motion", () => {
    reducedMotion(true);
    const advance = vi.fn();
    renderHook(() => useAutoAdvance(advance, 1000));

    tick(10_000);

    expect(advance).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const advance = vi.fn();
    renderHook(() => useAutoAdvance(advance, 1000, false));

    tick(5000);

    expect(advance).not.toHaveBeenCalled();
  });

  it("calls the latest function, not the one from when it started", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useAutoAdvance(fn, 1000), { initialProps: { fn: first } });

    rerender({ fn: second });
    tick(1000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops when it goes away", () => {
    const advance = vi.fn();
    const { unmount } = renderHook(() => useAutoAdvance(advance, 1000));

    unmount();
    tick(5000);

    expect(advance).not.toHaveBeenCalled();
  });
});
