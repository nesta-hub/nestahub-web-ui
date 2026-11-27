import { useEffect, useState } from "react";
import { ArrowRight, Package, X } from "lucide-react";
import { toast } from "sonner";
import { usePendingExtras } from "@/contexts/PendingExtrasContext";
import { useShoppingForExtras } from "@/hooks/useShoppingForExtras";
import { useSubscriptionTab } from "@/hooks/useSubscriptionTab";
import { formatPrice } from "@/lib/api";
import { describePlace, formatDay } from "@/lib/subscriptionBoxes";
import { ConfirmExtrasSheet } from "./ConfirmExtrasSheet";
import { useBackToTab } from "./useBackToTab";

/** The mode bar's height, and the bar at the bottom: the page leaves room for both. */
const TOP_BAR_PX = 84;
const PROCEED_BAR_PX = 100;

/** Put a style back as it was: as it was set, or not set at all. */
function restore(property: "padding-top" | "padding-bottom", before: string): void {
  if (before) document.body.style.setProperty(property, before);
  else document.body.style.removeProperty(property);
}

/**
 * What the shop looks like while she is adding extra items to an order that is waiting for her: a bar over the top
 * saying so (with a way out), and, once she has picked something, a "Proceed" bar at the bottom that opens the
 * "Confirm extra items" sheet. Mounted once, in App.tsx, inside the router. Anywhere else it renders nothing.
 */
export function PendingExtrasBar() {
  const boxId = useShoppingForExtras();
  if (!boxId) return null;
  return <ActiveBar boxId={boxId} />;
}

function ActiveBar({ boxId }: { boxId: string }) {
  const { count, picks, cancel } = usePendingExtras();
  const { data, accessToken } = useSubscriptionTab();
  const backToTab = useBackToTab(accessToken);
  const [reviewing, setReviewing] = useState(false);

  const box = data?.boxes.find((b) => b.id === boxId) ?? null;
  const showProceed = count > 0;
  const total = picks.reduce((sum, p) => sum + p.unitPriceKobo * p.quantity, 0);

  // The order she was adding to has gone, or can no longer be changed (paid, skipped, past its pay-by time).
  const gone = !!data && (!box || !box.editable);
  useEffect(() => {
    if (!gone) return;
    cancel();
    toast.error("That order can no longer be changed");
  }, [gone, cancel]);

  // The bars cover the top and the bottom of the page, so leave room for them (and tell the shop's own sticky rows).
  useEffect(() => {
    const root = document.documentElement;
    const before = document.body.style.getPropertyValue("padding-top");
    root.style.setProperty("--pending-bar-h", `${TOP_BAR_PX}px`);
    document.body.style.setProperty("padding-top", `${TOP_BAR_PX}px`);
    return () => {
      root.style.removeProperty("--pending-bar-h");
      restore("padding-top", before);
    };
  }, []);
  useEffect(() => {
    if (!showProceed) return;
    const before = document.body.style.getPropertyValue("padding-bottom");
    document.body.style.setProperty("padding-bottom", `${PROCEED_BAR_PX}px`);
    return () => {
      restore("padding-bottom", before);
    };
  }, [showProceed]);

  if (gone) return null;

  /** Close: leave the mode, dropping what she picked, and go back to her order. */
  const close = () => {
    cancel();
    backToTab();
  };

  return (
    <>
      {/* The mode bar: she is adding to an order that is waiting for her. */}
      <div
        role="region"
        aria-label="Adding extra items"
        className="fixed inset-x-0 top-0 z-40 box-border h-[84px] rounded-b-[26px] bg-[#DDE3DA] pl-5 pr-4 pt-3.5 text-shop-ink shadow-[0_10px_24px_-16px_rgba(51,38,28,0.4)] md:top-20"
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#46564A]">
            <Package className="h-[19px] w-[19px]" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-extrabold leading-5 tracking-[-0.01em]">
              {count > 0 ? `${count} extra ${count === 1 ? "item" : "items"} added` : "Adding to your pending order"}
            </span>
            <span className="block truncate text-[12.5px] font-semibold leading-[17px] text-[#46564A]">
              {box ? `For ${formatDay(box.deliveryDate)} · ${describePlace(box.delivery)}` : "For your next order"}
            </span>
          </span>
          <button
            type="button"
            aria-label="Close and go back to your order"
            onClick={close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink"
          >
            <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The pending order, one tap away once something is in it. */}
      {showProceed && (
        <div
          role="region"
          aria-label="Your extra items"
          className="fixed inset-x-0 bottom-0 z-40 box-border h-[100px] border-t border-shop-line bg-shop-cream/[0.96] px-5 pt-3 backdrop-blur-[14px]"
        >
          <button
            type="button"
            disabled={!box}
            onClick={() => setReviewing(true)}
            className="flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover disabled:opacity-50"
          >
            <span>Proceed</span>
            <span className="flex items-center gap-2.5">
              <span className="tabular-nums">{formatPrice(total)}</span>
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-cream text-shop-cta">
                <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
              </span>
            </span>
          </button>
        </div>
      )}

      {box && <ConfirmExtrasSheet box={box} accessToken={accessToken} open={reviewing} onClose={() => setReviewing(false)} />}
    </>
  );
}
