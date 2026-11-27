import type { ReactNode } from "react";
import { Bell, RefreshCw, Wallet } from "lucide-react";
import { AddItemButton } from "./AddItemButton";
import { ReminderPreview } from "./ReminderPreview";
import { UsualBuys } from "./UsualBuys";
import { brandedName, formatDay, type SubscribedItem } from "@/lib/subscriptionBoxes";
import { cn } from "@/lib/utils";
import { Thumb } from "./Thumb";

const CHIP = "inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-bold leading-3 tracking-[0.14em] text-[#46564A]";

const STEPS = [
  { icon: Bell, label: "You get reminders" },
  { icon: Wallet, label: "You simply pay, no reordering" },
  { icon: RefreshCw, label: "You remain in control" },
];

/** Shown when nothing is subscribed yet: the idea in one card, a way to pick an item, and what she already buys. */
export function EmptyTab() {
  return (
    <>
      <SubscribeIntroCard />
      <AddItemButton label="Subscribe to an item" className="mt-3.5" />
      <UsualBuys />
    </>
  );
}

/**
 * The idea in one card: never forget to order again, and the three steps. Not signed in, it shows the WhatsApp
 * reminder instead, with `action` (her way in) where the steps go.
 */
export function SubscribeIntroCard({ action }: { action?: ReactNode }) {
  return (
    <>
      <section aria-label="What Subscribe does" className="relative overflow-hidden rounded-[28px] bg-[#DDE3DA] px-5 pb-5 pt-[22px] shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]">
        <span aria-hidden="true" className="absolute -right-12 -top-16 h-[220px] w-[220px] rounded-full bg-[#E6EBE3]" />
        <span aria-hidden="true" className="absolute -bottom-[90px] right-16 h-[150px] w-[150px] rounded-full bg-[#D2DBD0]" />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-bold leading-3 tracking-[0.14em] text-[#46564A]">AUTO-RENEW</span>
          <h2 className="mt-2.5 max-w-[280px] text-[26px] font-bold leading-[31px] tracking-[-0.02em] text-shop-ink">Never forget to order again</h2>
          <p className="mt-2 max-w-[310px] text-[14px] leading-[21px] text-[#34443A]">Pick what you buy again and again. We remind you days before, and you simply pay.</p>
          {action ? (
            <>
              <ReminderPreview />
              <div className="mt-4">{action}</div>
            </>
          ) : (
          <ul className="mt-3.5 flex items-start justify-between gap-2 rounded-[20px] bg-white/[0.72] px-3.5 py-3">
            {STEPS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-1 list-none flex-col items-center gap-1.5">
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-shop-brown shadow-[0_4px_10px_-6px_rgba(51,38,28,0.4)]">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                </span>
                <span className="text-center text-[12px] font-semibold leading-[15px] text-shop-ink">{label}</span>
              </li>
            ))}
          </ul>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Items are subscribed, but no order is waiting yet. It takes the next-order card's place, so it is drawn the same way:
 * the chip, the day as the heading, what will be in it, and a plain status where the order card's status goes.
 */
export function NothingDueCard({ nextDue, dueThen = [] }: { nextDue: string | null; dueThen?: SubscribedItem[] }) {
  return (
    <section
      aria-label="Nothing to pay right now"
      className="relative overflow-hidden rounded-[28px] bg-[#DDE3DA] p-5 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]"
    >
      <span aria-hidden="true" className="absolute -right-12 -top-16 h-[200px] w-[200px] rounded-full bg-[#E6EBE3]" />
      <div className="relative">
        {nextDue ? (
          <>
            <span className={CHIP}>UPCOMING ORDER</span>
            <h2 className="mt-2 text-[32px] font-bold leading-[38px] tracking-[-0.025em] text-shop-ink">{formatDay(nextDue)}</h2>
            {dueThen.length > 0 && (
              <div className="mt-3.5 flex items-center gap-3 rounded-[18px] bg-white/[0.72] px-3 py-2.5">
                <span className="flex items-center">
                  {dueThen.slice(0, 3).map((item, i) => (
                    <span key={item.id} className={cn("h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#EFEAE4] ring-2 ring-[#EEF1EB]", i > 0 && "-ml-2.5")}>
                      <Thumb src={item.imageUrl} />
                    </span>
                  ))}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-semibold leading-[18px] text-shop-ink">
                  {dueThen.map((item) => (
                    <span key={item.id} className="block">
                      <span className="block">{`${brandedName(item.brand, item.productName)} ×${item.quantity}`}</span>
                      {item.variantLabel && <span className="block text-[12px] font-medium leading-4 text-[#46564A]">{item.variantLabel}</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <p role="status" className="mt-4 text-[13px] leading-[18px] text-[#34443A]">
              <b className="font-semibold text-shop-ink">Nothing to pay right now.</b> We will remind you before it is due.
            </p>
          </>
        ) : (
          <>
            <span className={CHIP}>ALL PAUSED</span>
            <h2 className="mt-2 text-[22px] font-bold leading-7 tracking-[-0.02em] text-shop-ink">Nothing coming up</h2>
            <p role="status" className="mt-1 text-[13px] leading-[18px] text-[#34443A]">
              <b className="font-semibold text-shop-ink">Your items are paused.</b> Resume one to get your next order.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
