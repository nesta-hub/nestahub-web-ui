import { useEffect, useState, type RefObject } from "react";

interface Options {
  /** A section counts as reached once its top is this far (px) from the top of the window. */
  probe?: number;
  /** The bar counts as stuck once its top is at or above this (px). */
  stuckAt?: number;
}

/**
 * Which group section the shopper is looking at, and whether the sticky bar above them has
 * stuck to the top. Read from the page as it scrolls, a frame at a time.
 */
export function useGroupScrollSpy(
  sectionIds: string[],
  barRef: RefObject<HTMLElement | null>,
  { probe = 200, stuckAt = 81 }: Options = {},
) {
  const [active, setActive] = useState<string | null>(sectionIds[0] ?? null);
  const [stuck, setStuck] = useState(false);
  const key = sectionIds.join("|");

  useEffect(() => {
    const ids = key ? key.split("|") : [];
    let frame = 0;

    const measure = () => {
      frame = 0;
      let current: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      setActive(current);
      const bar = barRef.current;
      setStuck(!!bar && bar.getBoundingClientRect().top <= stuckAt);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key, probe, stuckAt, barRef]);

  return { active, stuck };
}
