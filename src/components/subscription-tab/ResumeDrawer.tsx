import { brandedName, type SubscribedItem } from "@/lib/subscriptionBoxes";
import { BottomSheet } from "./BottomSheet";
import { shortFrequency } from "@/lib/renewalFrequency";

/** From the "we paused it" message: the paused items, each with a button to turn it back on. */
export function ResumeDrawer({
  items,
  open,
  busy,
  onClose,
  onResume,
}: {
  items: SubscribedItem[];
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onResume: (id: string) => Promise<boolean>;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Turn back on" subtitle="These are paused. Turn on the ones you want.">
      {items.length === 0 ? (
        <p className="py-4 text-[14px] text-[#5A4E44]">Everything is on. Nothing is paused.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b border-[#EEE8E1] py-3">
            <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold leading-[18px]">{brandedName(item.brand, item.productName)}</span>
              <span className="block text-[12px] leading-4 text-[#6B5F55]">{shortFrequency(item.frequency)}</span>
            </span>
            <button
              type="button"
              aria-label={`Turn on ${item.productName}`}
              disabled={busy}
              onClick={() => onResume(item.id)}
              className="h-10 rounded-[20px] bg-shop-cta hover:bg-shop-cta-hover px-4 text-[13px] font-bold text-shop-cream disabled:opacity-50"
            >
              Turn on
            </button>
          </div>
        ))
      )}
    </BottomSheet>
  );
}
