import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@/lib/api";
import { BOX_CODES, BoxApiError, subscriptionBoxesApi, type Box } from "@/lib/subscriptionBoxes";
import { usePendingExtras } from "@/contexts/PendingExtrasContext";
import { BigButton, BottomSheet } from "@/components/subscription-tab/BottomSheet";
import { Thumb } from "@/components/subscription-tab/Thumb";
import { useBackToTab } from "./useBackToTab";

/** The most of one thing an order can hold as extras (the API's limit). */
const MAX_PER_ITEM = 20;

interface Props {
  box: Box;
  /** Her sign-in, or null when she came by a link in a message. */
  accessToken: string | null;
  open: boolean;
  onClose: () => void;
}

/** The variants an "extra not available" answer names, when it names any. */
function unavailableVariants(error: BoxApiError): string[] {
  const ids = error.body?.variantIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

/**
 * "Confirm extra items": what she picked and what it comes to, with a Remove for each and a Complete button that puts
 * them in the order. Nothing here can be made bigger (that is done on the product page), and nothing reaches the
 * server until she taps Complete.
 */
export function ConfirmExtrasSheet({ box, accessToken, open, onClose }: Props) {
  const { picks, setQuantity, cancel } = usePendingExtras();
  const queryClient = useQueryClient();
  const backToTab = useBackToTab(accessToken);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Each time it opens, start without an old message.
  useEffect(() => {
    if (open) setMessage(null);
  }, [open]);

  /** How many of each she already has in this order as one-time extras. */
  const inOrder = useMemo(() => {
    const counts = new Map<string, number>();
    for (const line of box.items) {
      if (line.kind === "one_time") counts.set(line.variantId, (counts.get(line.variantId) ?? 0) + line.quantity);
    }
    return counts;
  }, [box.items]);

  const extrasKobo = picks.reduce((sum, p) => sum + p.unitPriceKobo * p.quantity, 0);

  const remove = (variantId: string) => {
    // Taking out the last one closes the sheet: there is nothing left to confirm.
    if (picks.length === 1) onClose();
    setQuantity(variantId, 0);
  };

  const complete = async () => {
    if (busy || picks.length === 0) return;
    setBusy(true);
    setMessage(null);
    // The API sets how many she wants in the box, so what is already there is added to what she picked.
    const items = picks.map((p) => ({ variantId: p.variantId, quantity: Math.min(MAX_PER_ITEM, (inOrder.get(p.variantId) ?? 0) + p.quantity) }));
    try {
      await subscriptionBoxesApi.setExtras(accessToken, box.id, items);
      cancel();
      void queryClient.invalidateQueries({ queryKey: ["subscription-tab"] });
      toast.success("Added to your order");
      backToTab();
    } catch (error) {
      if (error instanceof BoxApiError && (error.code === BOX_CODES.notEditable || error.code === BOX_CODES.paymentStarted)) {
        cancel();
        void queryClient.invalidateQueries({ queryKey: ["subscription-tab"] });
        toast.error("This order can no longer be changed");
        backToTab();
      } else if (error instanceof BoxApiError && error.code === BOX_CODES.extraNotAvailable) {
        const gone = unavailableVariants(error).filter((id) => picks.some((p) => p.variantId === id));
        if (gone.length > 0) {
          gone.forEach((id) => setQuantity(id, 0));
          setMessage(gone.length === 1 ? "1 item is no longer available and was taken out" : `${gone.length} items are no longer available and were taken out`);
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage(error instanceof BoxApiError ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Confirm extra items"
      footer={
        <BigButton busy={busy} disabled={picks.length === 0} onClick={() => void complete()}>
          Complete
        </BigButton>
      }
    >
      {picks.length === 0 ? (
        <p className="py-4 text-[14px] leading-5 text-[#6B5F55]">Nothing picked yet.</p>
      ) : (
        <ul aria-label="Extra items you picked" className="m-0 list-none p-0">
          {picks.map((pick) => (
            <li key={pick.variantId} className="flex items-center gap-3 border-b border-[#EEE8E1] py-3">
              <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]">
                <Thumb src={pick.imageUrl} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold leading-[18px]">{pick.productName}</span>
                <span className="block text-[12px] leading-4 text-[#6B5F55]">
                  {[pick.variantLabel ? `${pick.variantLabel}${pick.quantity > 1 ? ` · ×${pick.quantity}` : ""}` : pick.quantity > 1 ? `×${pick.quantity}` : null, formatPrice(pick.unitPriceKobo * pick.quantity)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${pick.productName}`}
                disabled={busy}
                onClick={() => remove(pick.variantId)}
                className="flex h-10 shrink-0 items-center rounded-[20px] border-[1.5px] border-shop-brown bg-transparent px-4 text-[13px] font-extrabold text-shop-brown disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {picks.length > 0 && (
        <div className="pb-1.5 pt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold leading-5 text-[#6B5F55]">Extra items total</span>
            <span className="text-[15px] font-extrabold leading-5 tabular-nums">{formatPrice(extrasKobo)}</span>
          </div>
          {box.totalKobo !== null && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[13.5px] font-bold leading-5 text-[#6B5F55]">Pending order total</span>
              <span className="text-[20px] font-extrabold leading-[26px] tabular-nums">{formatPrice(box.totalKobo + extrasKobo)}</span>
            </div>
          )}
        </div>
      )}
      {message && (
        <p role="alert" className="mt-3 rounded-[14px] bg-[#F6E7E2] px-3.5 py-2.5 text-[13px] leading-[18px] text-[#7A3A2C]">
          {message}
        </p>
      )}
    </BottomSheet>
  );
}
