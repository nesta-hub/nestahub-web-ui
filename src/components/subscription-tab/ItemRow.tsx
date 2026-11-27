import { ChevronRight } from "lucide-react";
import { brandedName, formatDay, type SubscribedItem } from "@/lib/subscriptionBoxes";
import { problemText } from "./problemText";
import { Thumb } from "./Thumb";
import { shortFrequency } from "@/lib/renewalFrequency";

/** One subscribed item: picture, name, what it is, how often, and when it is next due. */
export function ItemRow({ item, onOpen }: { item: SubscribedItem; onOpen: () => void }) {
  const paused = item.status === "paused";
  const name = brandedName(item.brand, item.productName);
  return (
    <li className="list-none rounded-3xl bg-white shadow-[0_12px_28px_-12px_rgba(51,38,28,0.22),0_2px_8px_rgba(51,38,28,0.05)]">
      <button
        type="button"
        aria-label={`Manage ${name}`}
        onClick={onOpen}
        className="flex w-full items-center gap-3.5 rounded-3xl py-3.5 pl-3.5 pr-3 text-left"
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-[#EFEAE4]">
          <Thumb src={item.imageUrl} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          {/* With no size or type, how many goes after the name, as on the order card; otherwise beside the size. */}
          <span className="text-[14.5px] font-semibold leading-5 text-shop-ink">
            {name}
            {!item.variantLabel && <span className="font-normal text-[#6B5F55]">{` ×${item.quantity}`}</span>}
          </span>
          {item.variantLabel && <span className="text-[12.5px] leading-[18px] text-[#6B5F55]">{`${item.variantLabel} · ×${item.quantity}`}</span>}
          <span className="mt-[5px] flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-[14px] border border-shop-line bg-shop-page px-3 text-[12px] font-semibold text-shop-ink">
              {paused ? "Paused" : shortFrequency(item.frequency)}
            </span>
            {!paused && item.nextDue && <span className="text-[12px] leading-4 text-[#7A6E64]">Next: {formatDay(item.nextDue)}</span>}
          </span>
          {item.problem && <span className="mt-1.5 text-[12px] leading-4 text-[#9A4A3A]">{problemText(item.problem)}</span>}
        </span>
        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#9A8F85]" strokeWidth={2.2} aria-hidden="true" />
      </button>
    </li>
  );
}
