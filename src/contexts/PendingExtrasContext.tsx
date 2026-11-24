import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * "Add extra items" to the order she is about to pay.
 *
 * While `boxId` is set she is shopping for that order, not for herself: the product page adds to this list
 * instead of the cart, and a bar over the shop offers to confirm. Nothing here reaches the server until she
 * confirms (see subscriptionBoxesApi.setExtras), so leaving the shop, closing the tab or tapping Cancel
 * costs nothing.
 *
 * Kept for the visit (sessionStorage) so a refresh does not lose her picks, and never longer.
 */
export interface PendingExtra {
  variantId: string;
  productName: string;
  brand: string | null;
  variantLabel: string | null;
  imageUrl?: string | null;
  /** Kobo, as shown on the product page. The box prices it again when it is confirmed. */
  unitPriceKobo: number;
  quantity: number;
}

interface PendingExtrasValue {
  /** The order she is adding to, or null when she is shopping normally. */
  boxId: string | null;
  /** What she has picked so far. */
  picks: PendingExtra[];
  /** Total number of things picked. */
  count: number;
  /** Start shopping for this order. Starting for another order forgets the picks for the first. */
  start: (boxId: string) => void;
  /** Add this many (on top of any already picked). */
  add: (extra: Omit<PendingExtra, "quantity">, quantity: number) => void;
  /** Set how many of one pick. 0 takes it out. */
  setQuantity: (variantId: string, quantity: number) => void;
  /** Stop and forget everything. */
  cancel: () => void;
}

const STORAGE_KEY = "nesta_pending_extras";

/** What a component gets outside a provider (a bare test, a preview): shopping normally, and nothing to add to. */
const INERT: PendingExtrasValue = {
  boxId: null,
  picks: [],
  count: 0,
  start: () => undefined,
  add: () => undefined,
  setQuantity: () => undefined,
  cancel: () => undefined,
};

const PendingExtrasContext = createContext<PendingExtrasValue>(INERT);

interface Saved {
  boxId: string | null;
  picks: PendingExtra[];
}

function load(): Saved {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { boxId: null, picks: [] };
    const saved = JSON.parse(raw) as Partial<Saved>;
    if (typeof saved.boxId !== "string" || !Array.isArray(saved.picks)) return { boxId: null, picks: [] };
    return { boxId: saved.boxId, picks: saved.picks.filter((p) => p && typeof p.variantId === "string" && Number.isInteger(p.quantity) && p.quantity > 0) };
  } catch {
    return { boxId: null, picks: [] };
  }
}

export function PendingExtrasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(load);

  useEffect(() => {
    try {
      if (state.boxId) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* it still works for this page; it just cannot survive a refresh */
    }
  }, [state]);

  const start = useCallback((boxId: string) => setState((prev) => (prev.boxId === boxId ? prev : { boxId, picks: [] })), []);

  const add = useCallback((extra: Omit<PendingExtra, "quantity">, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setState((prev) => {
      if (!prev.boxId) return prev;
      const at = prev.picks.findIndex((p) => p.variantId === extra.variantId);
      if (at < 0) return { ...prev, picks: [...prev.picks, { ...extra, quantity }] };
      const picks = [...prev.picks];
      picks[at] = { ...picks[at], ...extra, quantity: picks[at].quantity + quantity };
      return { ...prev, picks };
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      picks:
        quantity > 0
          ? prev.picks.map((p) => (p.variantId === variantId ? { ...p, quantity } : p))
          : prev.picks.filter((p) => p.variantId !== variantId),
    }));
  }, []);

  const cancel = useCallback(() => setState({ boxId: null, picks: [] }), []);

  const value = useMemo<PendingExtrasValue>(
    () => ({ boxId: state.boxId, picks: state.picks, count: state.picks.reduce((n, p) => n + p.quantity, 0), start, add, setQuantity, cancel }),
    [state, start, add, setQuantity, cancel],
  );

  return <PendingExtrasContext.Provider value={value}>{children}</PendingExtrasContext.Provider>;
}

export const usePendingExtras = () => useContext(PendingExtrasContext);
