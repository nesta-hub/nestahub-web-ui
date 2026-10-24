import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGroupScrollSpy } from "./useGroupScrollSpy";

/** Put an element in the page whose top is wherever the test says it is. */
function section(id: string, top: () => number) {
  const el = document.createElement("section");
  el.id = id;
  el.getBoundingClientRect = () => ({ top: top() }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

let tops: Record<string, number>;
let barTop: number;
const bar = document.createElement("nav");
bar.getBoundingClientRect = () => ({ top: barTop }) as DOMRect;

beforeEach(() => {
  tops = { "g-a": 600, "g-b": 1400, "g-c": 2200 };
  barTop = 300;
  for (const id of Object.keys(tops)) section(id, () => tops[id]);
  // One frame runs at once, so a scroll is measured straight away.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 0));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

const scroll = () => act(() => void window.dispatchEvent(new Event("scroll")));
const render = (ids = ["g-a", "g-b", "g-c"]) => renderHook(() => useGroupScrollSpy(ids, { current: bar } as never));

describe("which group the shopper is at", () => {
  it("starts on the first", () => {
    expect(render().result.current.active).toBe("g-a");
  });

  it("moves on once the next section's top reaches the top of the page", () => {
    const { result } = render();

    tops = { "g-a": -300, "g-b": 150, "g-c": 950 }; // g-b is within 200px of the top
    scroll();

    expect(result.current.active).toBe("g-b");
  });

  it("does not move on while the next section is still further down", () => {
    const { result } = render();

    tops = { "g-a": 0, "g-b": 201, "g-c": 1000 };
    scroll();

    expect(result.current.active).toBe("g-a");
  });

  it("takes the last section reached", () => {
    const { result } = render();

    tops = { "g-a": -2000, "g-b": -900, "g-c": 120 };
    scroll();

    expect(result.current.active).toBe("g-c");
  });

  it("copes with a section that is not on the page", () => {
    const { result } = render(["g-a", "g-missing", "g-c"]);

    tops = { "g-a": -100, "g-b": 0, "g-c": 900 };
    scroll();

    expect(result.current.active).toBe("g-a");
  });
});

describe("whether the bar has stuck", () => {
  it("is not stuck while the bar is lower down", () => {
    expect(render().result.current.stuck).toBe(false);
  });

  it("sticks once the bar reaches the top", () => {
    const { result } = render();

    barTop = 80;
    scroll();
    expect(result.current.stuck).toBe(true);

    barTop = 120;
    scroll();
    expect(result.current.stuck).toBe(false);
  });
});

describe("cleaning up", () => {
  it("stops listening when it goes away", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render();

    unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
