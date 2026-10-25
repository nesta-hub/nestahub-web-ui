import { useCallback, useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Calls `advance` every `everyMs`, for carousels that move on their own.
 *
 * It stands still while the pointer is over the carousel (`setHeld(true)`), for a while after
 * the shopper moves it themselves (`pauseFor(ms)`), and always for visitors who ask their
 * device for reduced motion.
 */
export function useAutoAdvance(advance: () => void, everyMs: number, enabled = true) {
  const latest = useRef(advance);
  useEffect(() => {
    latest.current = advance;
  });

  const held = useRef(false);
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const timer = setInterval(() => {
      if (held.current || Date.now() < pausedUntil.current) return;
      latest.current();
    }, everyMs);
    return () => clearInterval(timer);
  }, [everyMs, enabled]);

  const pauseFor = useCallback((ms: number) => {
    pausedUntil.current = Date.now() + ms;
  }, []);
  const setHeld = useCallback((value: boolean) => {
    held.current = value;
  }, []);

  return { pauseFor, setHeld };
}
