import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribedLine } from "@/hooks/useSubscribedItems";
import type { SubscribedItem } from "@/lib/subscriptionBoxes";

/**
 * In place of the Subscribe switch, when she already subscribes to this type and size: what she has, and the way to
 * change it. She can still buy it once; a second subscription to the same thing is not offered.
 */
export function AlreadySubscribedCard({ item }: { item: SubscribedItem }) {
  return (
    <section aria-label="Your subscription" className="rounded-[24px] border border-[#E5E0DC] bg-white p-[15px] text-shop-ink">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
          <RefreshCw className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-[22px]">You subscribe to this</p>
          <p className="mt-0.5 text-[12.5px] font-medium leading-[17px] text-shop-muted">{subscribedLine(item)}</p>
          <Link
            to="/subscriptions"
            className="-my-2 inline-block py-2 text-[12.5px] font-semibold leading-[17px] text-shop-brown underline underline-offset-[3px]"
          >
            View subscription
          </Link>
        </div>
      </div>
    </section>
  );
}
