import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import type { Category } from "@/lib/api";

/** Links already opened since the page loaded: coming Back to one must not open it again. */
const opened = new Set<string>();

/** For tests: forget which links have been opened. */
export const forgetOpenedLinks = () => opened.clear();

/**
 * Arriving by a category's link (/shop/:group/:category), call `onArrive` with it, once, as soon as
 * the categories have loaded. Closing the drawer, opening a product or coming Back does not call it
 * again; following the link again does.
 */
export function useLinkedCategory(category: Category | null, enabled: boolean, onArrive: (category: Category) => void) {
  const { pathname } = useLocation();
  const navigation = useNavigationType();
  /** The address this visit has dealt with. Only the path counts: opening a product changes the query. */
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (handled.current !== pathname) handled.current = null;
    if (!enabled || !category || handled.current) return;
    handled.current = pathname;
    if (navigation === "POP" && opened.has(pathname)) return;
    opened.add(pathname);
    onArrive(category);
    // Only arriving matters: not `onArrive` or the category being rebuilt as the page re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, enabled, category?.id]);
}
