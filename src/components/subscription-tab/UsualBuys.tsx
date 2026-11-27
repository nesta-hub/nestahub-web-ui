import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SubscribeSheet, type EnrolOutcome } from "@/components/subscribe-more/SubscribeSheet";
import { describeEnrolFailure } from "@/components/subscribe-more/helpers";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionBoxesApi, type CatalogItem, type EnrolInput } from "@/lib/subscriptionBoxes";
import { Thumb } from "./Thumb";
import { MAX_SHOWN, asCatalogItem, boughtLine } from "./usualBuysHelpers";

/**
 * On a tab with nothing subscribed yet: what she has been buying lately, each a tap from subscribed.
 * Shows nothing while it finds out, when she has bought nothing we can subscribe her to, or if anything goes wrong:
 * the invitation above it stands on its own.
 */
export function UsualBuys() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const queryClient = useQueryClient();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [sheetId, setSheetId] = useState(0);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["subscribe-offer", "usual"],
    queryFn: () => subscriptionBoxesApi.offer(accessToken),
    enabled: !!accessToken,
    retry: false,
    staleTime: 60_000,
  });

  const lines = data?.state === "offer" ? data.eligible.slice(0, MAX_SHOWN) : [];
  if (!lines.length) return null;

  const subscribe = async (target: CatalogItem, input: EnrolInput): Promise<EnrolOutcome> => {
    try {
      await subscriptionBoxesApi.enrol(accessToken, input);
    } catch (failure) {
      return { ok: false, message: describeEnrolFailure(failure).message };
    }
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["subscription-tab"] });
    void queryClient.invalidateQueries({ queryKey: ["subscribe-offer"] });
    toast.success(`You're subscribed to ${target.productName}`);
    return { ok: true };
  };

  return (
    <section aria-label="What you buy the most">
      <h3 className="mb-3 mt-[26px] text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-[#6B5F55]">Choose from what you buy the most</h3>
      <ul aria-label="Items you can subscribe to" className="m-0 flex list-none flex-col gap-3 p-0">
        {lines.map((line) => (
          <li key={line.variantId} className="flex list-none items-center gap-3.5 rounded-3xl bg-white p-3.5 shadow-[0_12px_28px_-12px_rgba(51,38,28,0.22),0_2px_8px_rgba(51,38,28,0.05)]">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-[#EFEAE4]">
              <Thumb src={line.imageUrl} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-extrabold leading-5 text-shop-ink">{line.productName}</span>
              <span className="text-[12.5px] leading-[18px] text-[#6B5F55]">{boughtLine(line)}</span>
            </span>
            <button
              type="button"
              aria-label={`Subscribe to ${line.productName}`}
              onClick={() => {
                setItem(asCatalogItem(line));
                setSheetId((n) => n + 1);
                setOpen(true);
              }}
              className="h-11 shrink-0 rounded-[22px] bg-shop-cta hover:bg-shop-cta-hover px-4 text-[13px] font-extrabold text-shop-cream"
            >
              Subscribe
            </button>
          </li>
        ))}
      </ul>

      {item && <SubscribeSheet key={sheetId} item={item} open={open} onClose={() => setOpen(false)} onSubscribe={(input) => subscribe(item, input)} />}
    </section>
  );
}
