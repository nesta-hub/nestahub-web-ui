import { useState } from "react";
import { Bell, RefreshCw, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { EYEBROW, startingChoice, type SubscribeChoice } from "./choice";
import { SubscribeChoiceFields } from "./SubscribeChoiceFields";

interface Props {
  /** Kobo. */
  price: number;
  subscriptionPrice?: number | null;
  recommendedFrequencyWeeks?: number | null;
  quantity: number;
  /** What she has chosen, or null for a one-time purchase. */
  value: SubscribeChoice | null;
  onChange: (next: SubscribeChoice | null) => void;
  /** For tests. */
  now?: Date;
}

const HOW_IT_WORKS = [
  { icon: Bell, title: "We remind you", text: "A WhatsApp reminder comes before you run out, at the renewal frequency you choose." },
  { icon: Wallet, title: "You pay when you are ready", text: "You get a direct payment link and you pay once you are ready." },
  { icon: RefreshCw, title: "You stay in control", text: "Skip an order, change the quantity or size, pause, or stop whenever you like." },
];

/**
 * The Subscribe card on the product page: a switch that, when on, opens how often it renews, the month check and,
 * for weekly, the day of the first renewal.
 *
 * It opens in place rather than in a drawer, because the product page is already inside one; "Learn more" opens
 * in place for the same reason.
 * The one place that decides what a subscription line looks like is the cart; this only collects the choice.
 */
export function SubscribeCard({ price, subscriptionPrice, recommendedFrequencyWeeks, quantity, value, onChange, now }: Props) {
  const [learnMore, setLearnMore] = useState(false);
  const on = value !== null;
  // "and pay ₦9,025": only when subscribing costs less.
  const payInstead = subscriptionPrice && subscriptionPrice < price ? subscriptionPrice * quantity : null;

  return (
    <section aria-label="Subscribe" className="rounded-[24px] border border-[#E5E0DC] bg-white p-[15px] text-left text-shop-ink">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
          <RefreshCw className="h-6 w-6" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[16px] font-extrabold leading-[22px]">
            Subscribe
            {payInstead !== null && (
              <span className="whitespace-nowrap rounded-full bg-[#DDE3DA] px-[9px] py-[3px] text-[12px] font-extrabold leading-[18px] text-[#34443A]">
                and pay {formatPrice(payInstead)}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] font-medium leading-[17px] text-shop-muted">
            Never run out or come back to reorder.{" "}
            <button
              type="button"
              aria-expanded={learnMore}
              onClick={() => setLearnMore((open) => !open)}
              className="-mx-0.5 -my-2 inline px-0.5 py-2 font-bold text-shop-brown underline underline-offset-[3px]"
            >
              Learn more
            </button>
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Subscribe to this item"
          onClick={() => onChange(on ? null : startingChoice(recommendedFrequencyWeeks, quantity))}
          className="relative h-11 w-12 shrink-0"
        >
          <span aria-hidden="true" className={`absolute left-0 top-[7px] h-[30px] w-12 rounded-[15px] transition-colors duration-200 ${on ? "bg-shop-brown" : "bg-[#D5CCC1]"}`} />
          <span
            aria-hidden="true"
            className={`absolute top-[9px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_2px_4px_rgba(51,38,28,0.3)] transition-[left] duration-200 ${on ? "left-5" : "left-0.5"}`}
          />
        </button>
      </div>

      {learnMore && (
        <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
          <p className="text-[20px] font-extrabold leading-[25px] tracking-[-0.01em]">How Subscribe works</p>
          <p className="text-[12.5px] leading-[17px] text-shop-muted">Auto-renew this item, and never run out.</p>
          <ul className="mt-3.5">
            {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 border-b border-[#EEE8E1] py-3 last:border-b-0 last:pb-0">
                <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <b className="block text-[14.5px] font-extrabold leading-[19px]">{title}</b>
                  <span className="block text-[13px] leading-[19px] text-[#5A4E44]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {on && (
        <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
          <p className={`mb-2.5 ${EYEBROW}`}>Renewal frequency</p>
          <SubscribeChoiceFields value={value} onChange={onChange} recommendedFrequencyWeeks={recommendedFrequencyWeeks} quantity={quantity} now={now} />
        </div>
      )}
    </section>
  );
}
