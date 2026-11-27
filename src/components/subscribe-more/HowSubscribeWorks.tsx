import type { ReactNode } from "react";
import { Bell, RefreshCw, Wallet } from "lucide-react";
import { BigButton, BottomSheet } from "@/components/subscription-tab/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Point({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
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
        <Point icon={<RefreshCw className="h-4 w-4" strokeWidth={2} />} title="You stay in control">
          Skip an order, change the quantity or size, pause, or stop whenever you like.
        </Point>
      </ul>
      <div className="mt-2">
        <BigButton onClick={onClose}>Got it</BigButton>
      </div>
    </BottomSheet>
  );
}
