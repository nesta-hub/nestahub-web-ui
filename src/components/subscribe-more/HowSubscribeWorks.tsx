import type { ReactNode } from "react";
import { ArrowRight, Bell, RefreshCw, Wallet } from "lucide-react";
import { BottomSheet } from "@/components/subscription-tab/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Point({ icon, title, children, last }: { icon: ReactNode; title: string; children: ReactNode; last?: boolean }) {
  return (
    <li className={`flex gap-3 py-3 ${last ? "" : "border-b border-[#EEE8E1]"}`}>
      <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
        {icon}
      </span>
      <span>
        <b className="block text-[14.5px] font-extrabold leading-[19px]">{title}</b>
        <span className="block text-[13px] leading-[19px] text-[#5A4E44]">{children}</span>
      </span>
    </li>
  );
}

/** "Learn more" on the product page: how Subscribe works, in three points. Tap outside, drag down or "Got it" to close. */
export function HowSubscribeWorks({ open, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="How Subscribe works" subtitle="Auto-renew this item, and never run out.">
      <ul className="m-0 mt-1.5 list-none p-0">
        <Point icon={<Bell className="h-4 w-4" strokeWidth={2} />} title="We remind you">
          A WhatsApp reminder comes before you run out, at the renewal frequency you choose.
        </Point>
        <Point icon={<Wallet className="h-4 w-4" strokeWidth={2} />} title="You pay when you are ready">
          You get a direct payment link and you pay once you are ready.
        </Point>
        <Point icon={<RefreshCw className="h-4 w-4" strokeWidth={2} />} title="You stay in control" last>
          Skip an order, change the quantity or size, pause, or stop whenever you like.
        </Point>
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover"
      >
        <span>Got it</span>
        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-cream text-shop-cta">
          <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
        </span>
      </button>
    </BottomSheet>
  );
}
