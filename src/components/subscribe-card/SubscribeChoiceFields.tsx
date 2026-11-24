import { useState } from "react";
import { RenewalFrequencyPicker } from "@/components/subscription-tab/RenewalFrequencyPicker";
import { addDaysYmd, isYmd, lagosToday } from "@/lib/lagosDay";
import { formatDay, type RenewalFrequency } from "@/lib/subscriptionBoxes";
import { EYEBROW, FIRST_RENEWAL_MAX_DAYS, type SubscribeChoice } from "./choice";
import { MonthCheck } from "./FitNudge";

interface Props {
  value: SubscribeChoice;
  onChange: (next: SubscribeChoice) => void;
  recommendedFrequencyWeeks?: number | null;
  /** How many she is subscribing to: it decides how long they last. */
  quantity: number;
  /** For tests. */
  now?: Date;
}

/**
 * How often it renews, and what goes with it: the picker; "Sure this will last a month?" when a monthly choice
 * does not fit how long it lasts; and, for weekly, the day of the first renewal.
 *
 * Used by the product page card, the setup after an order and "Subscribe to something else", so a choice is made
 * the same way everywhere. It only collects the choice. What it does to a cart line, or to a new subscription, is
 * decided elsewhere.
 */
export function SubscribeChoiceFields({ value, onChange, recommendedFrequencyWeeks, quantity, now }: Props) {
  const [pickingDate, setPickingDate] = useState(false);

  const today = lagosToday(now);
  const earliest = addDaysYmd(today, 1);
  const latest = addDaysYmd(today, FIRST_RENEWAL_MAX_DAYS);

  const setFrequency = (frequency: RenewalFrequency) => {
    // A first day only makes sense for "every N weeks".
    onChange(frequency.kind === "weeks" ? { ...value, frequency } : { frequency });
    if (frequency.kind !== "weeks") setPickingDate(false);
  };

  const setFirstDate = (raw: string) => {
    if (!raw) return onChange({ frequency: value.frequency });
    if (!isYmd(raw) || raw < earliest || raw > latest) return;
    onChange({ ...value, firstDate: raw });
  };

  return (
    <div>
      <RenewalFrequencyPicker value={value.frequency} onChange={setFrequency} />

      <div className="mt-3 empty:hidden">
        <MonthCheck frequency={value.frequency} recommendedFrequencyWeeks={recommendedFrequencyWeeks} quantity={quantity} />
      </div>

      {value.frequency.kind === "weeks" && (
        <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
          <p className={`mb-1 ${EYEBROW}`}>First renewal</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[16px] font-extrabold leading-[22px] text-shop-ink">
              {value.firstDate ? formatDay(value.firstDate) : `${value.frequency.every === 1 ? "A week" : `${value.frequency.every} weeks`} after it arrives`}
            </span>
            <button
              type="button"
              onClick={() => setPickingDate((open) => !open)}
              className="h-11 shrink-0 px-1.5 text-[13px] font-bold text-shop-brown underline underline-offset-[3px]"
            >
              {value.firstDate ? "Change" : "Pick a day"}
            </button>
          </div>
          {pickingDate && (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                aria-label="Day of the first renewal"
                min={earliest}
                max={latest}
                value={value.firstDate ?? ""}
                onChange={(event) => setFirstDate(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-xl border border-shop-line bg-white px-3 text-[14px] text-shop-ink"
              />
              {value.firstDate && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ frequency: value.frequency });
                    setPickingDate(false);
                  }}
                  className="h-11 shrink-0 px-2 text-[13px] font-bold text-shop-brown"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
