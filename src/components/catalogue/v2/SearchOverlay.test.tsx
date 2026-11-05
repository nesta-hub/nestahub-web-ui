import { fireEvent, render, screen } from "@testing-library/react";
import { Profiler } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchOverlay } from "./SearchOverlay";

/** What the search was asked for, and whether it was open at the time, on every render. */
const asked: Array<{ query: string; open: boolean }> = [];
vi.mock("@/hooks/useCatalogue", () => ({
  useProductSearch: (query: string, open: boolean) => {
    asked.push({ query, open });
    return { data: undefined, isFetching: false };
  },
}));

beforeEach(() => {
  asked.length = 0;
});

const box = () => screen.getByPlaceholderText("Search baby essentials, brands…") as HTMLInputElement;

const overlay = (props: { open: boolean; initialQuery?: string }) => (
  <SearchOverlay open={props.open} initialQuery={props.initialQuery} onClose={vi.fn()} onProductClick={vi.fn()} />
);

describe("the search overlay", () => {
  it("opens with an empty box", () => {
    render(overlay({ open: true }));

    expect(box().value).toBe("");
  });

  it("opens with a word already typed in when a card sent the shopper here with one", () => {
    render(overlay({ open: true, initialQuery: "Moobi" }));

    expect(box().value).toBe("Moobi");
    expect(asked.at(-1)).toEqual({ query: "Moobi", open: true });
  });

  it("lets the shopper change what was typed in for them", () => {
    render(overlay({ open: true, initialQuery: "Moobi" }));

    fireEvent.change(box(), { target: { value: "cot net" } });

    expect(box().value).toBe("cot net");
  });

  it("is empty again after it closes, and starts from the preset word each time it reopens", () => {
    const { rerender } = render(overlay({ open: true, initialQuery: "Moobi" }));
    fireEvent.change(box(), { target: { value: "cot net" } });

    rerender(overlay({ open: false, initialQuery: "Moobi" }));
    expect(screen.queryByPlaceholderText("Search baby essentials, brands…")).toBeNull();

    rerender(overlay({ open: true, initialQuery: "Moobi" }));
    expect(box().value).toBe("Moobi");
  });

  it("reopens empty when the next opening has no word to start with", () => {
    const { rerender } = render(overlay({ open: true, initialQuery: "Moobi" }));
    rerender(overlay({ open: false, initialQuery: "Moobi" }));

    rerender(overlay({ open: true, initialQuery: "" }));

    expect(box().value).toBe("");
  });

  it("never shows an empty box for a moment before the preset word (no flash)", () => {
    // What the box held at every frame that was actually put on screen.
    const frames: string[] = [];
    const watched = (open: boolean) => (
      <Profiler id="overlay" onRender={() => frames.push(document.querySelector("input")?.value ?? "(closed)")}>
        {overlay({ open, initialQuery: "Moobi" })}
      </Profiler>
    );
    const { rerender } = render(watched(false));
    frames.length = 0;

    rerender(watched(true));

    expect(frames.length).toBeGreaterThan(0);
    expect(frames).not.toContain("");
    expect(frames.at(-1)).toBe("Moobi");
  });
});
