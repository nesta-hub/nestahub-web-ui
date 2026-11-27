import { useLocation } from "react-router-dom";
import { usePendingExtras } from "@/contexts/PendingExtrasContext";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";

/** The shop and its product pages: /shop, /shop/..., /catalogue, /catalogue/... */
export function isShopPath(pathname: string): boolean {
  return ["/shop", "/catalogue"].some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

/**
 * The order she is adding extra items to, while she is in the shop doing it; otherwise null.
 *
 * True only when the new experience is on, she has started adding to an order, and she is on a shop page. Anything
 * that changes for that time (the bar over the shop, the bottom navigation going away, the full-page product) asks this.
 */
export function useShoppingForExtras(): string | null {
  const subscribeOn = useSubscribeEnabled();
  const { boxId } = usePendingExtras();
  const { pathname } = useLocation();
  return subscribeOn && boxId && isShopPath(pathname) ? boxId : null;
}
