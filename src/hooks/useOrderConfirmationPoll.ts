import { useEffect, useRef, useState } from "react";
import { getOrderStatus, type OrderStatus } from "@/lib/api";

/** PRD §1a: hold the buyer for at most this long. */
const WINDOW_MS = 30_000;
/** Most auto-confirms land in the first few seconds, so start tight… */
const FAST_INTERVAL_MS = 2_000;
/** …then ease off, since a confirm that hasn't landed by 10s rarely races. */
const SLOW_INTERVAL_MS = 3_000;
const SLOW_AFTER_MS = 10_000;

export type PollState = "waiting" | "confirmed" | "unconfirmed";

export interface ConfirmationPoll {
  state: PollState;
  status: OrderStatus | null;
}

/**
 * Poll one order until payment confirms, or for 30 seconds — whichever is
 * first (PRD §1).
 *
 * Roughly 12 requests across the window rather than the ~37 a sub-second
 * interval would cost, for no perceptible difference in how quickly the success
 * screen appears.
 *
 * Guests are authorized by the claim token, which `getOrderStatus` reads from
 * storage; no token is passed here.
 */
export function useOrderConfirmationPoll(
  orderNumber: string | null,
  accessToken?: string,
): ConfirmationPoll {
  const [state, setState] = useState<PollState>("waiting");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  // Survives re-renders so a parent re-render cannot restart the window.
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    startedAt.current = Date.now();

    const tick = async () => {
      if (cancelled) return;

      try {
        const next = await getOrderStatus(orderNumber, accessToken);
        if (cancelled) return;
        setStatus(next);
        if (next.confirmed) {
          setState("confirmed");
          return; // Done — stop polling.
        }
      } catch {
        // A failed poll is not a failed payment. Keep trying until the window
        // closes; the release screen is the honest answer either way.
      }

      const elapsed = Date.now() - (startedAt.current ?? Date.now());
      if (elapsed >= WINDOW_MS) {
        if (!cancelled) setState("unconfirmed");
        return;
      }

      timer = setTimeout(
        tick,
        elapsed < SLOW_AFTER_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS,
      );
    };

    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber, accessToken]);

  return { state, status };
}
