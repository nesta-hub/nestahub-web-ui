import { useState } from "react";
import { RenewalFrequencyPicker } from "@/components/subscription-tab/RenewalFrequencyPicker";
import { addDaysYmd, isYmd, lagosToday } from "@/lib/lagosDay";
import { nextDue } from "@/lib/renewalFrequency";
import { formatDay, type RenewalFrequency } from "@/lib/subscriptionBoxes";
import { EYEBROW, FIRST_RENEWAL_MAX_DAYS, type SubscribeChoice } from "./choice";

interface Props {
  value: SubscribeChoice;
  onChange: (next: SubscribeChoice) => void;
  /** Show "First renewal" (weekly only). Off on the shop's product pages, where it simply counts from delivery. */
  showFirstRenewal?: boolean;
  /**
   * Subscribing without buying it first: show the day of her first order instead, for any renewal frequency. Until
   * she changes it, it is one cycle from today (every 4 weeks: four weeks from today; the 27th: the next 27th).
   */
  firstOrder?: boolean;
  /** For tests. */
  now?: Date;
}

/**
 * How often it renews and, for weekly, the day of the first renewal (unless `showFirstRenewal` is off); or, with
 * `firstOrder`, the day of the first order for any frequency.
 *
 * Used by the product page card, the setup after an order and "Subscribe to something else", so a choice is made
 * the same way everywhere. It only collects the choice. What it does to a cart line, or to a new subscription, is
 * decided elsewhere.
 */
export function SubscribeChoiceFields({ value, onChange, showFirstRenewal = true, firstOrder = false, now }: Props) {
  const [pickingDate, setPickingDate] = useState(false);

  const today = lagosToday(now);
  const earliest = firstOrder ? today : addDaysYmd(today, 1);
  const latest = addDaysYmd(today, FIRST_RENEWAL_MAX_DAYS);
  const firstOrderDay = value.firstDate ?? nextDue(value.frequency, today);

  const setFrequency = (frequency: RenewalFrequency) => {
    // A first renewal day only makes sense for "every N weeks"; a first order's day goes with any frequency.
    if (firstOrder) return onChange({ ...value, frequency });
    onChange(frequency.kind === "weeks" ? { ...value, frequency } : { frequency });
    if (frequency.kind !== "weeks") setPickingDate(false);
  };

  const setFirstDate = (raw: string) => {
    if (!raw) return onChange({ frequency: value.frequency });
    if (!isYmd(raw) || raw < earliest || raw > latest) return;
    onChange({ ...value, firstDate: raw });
    // The day she picked takes the date's place; the picker has done its job.
    if (firstOrder) setPickingDate(false);
  };

  return (
    <div>
      <RenewalFrequencyPicker value={value.frequency} onChange={setFrequency} />

      {(firstOrder || (showFirstRenewal && value.frequency.kind === "weeks")) && (
        <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
          <p className={`mb-1 ${EYEBROW}`}>{firstOrder ? "First order" : "First renewal"}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[16px] font-bold leading-[22px] text-shop-ink">
              {firstOrder
                ? formatDay(firstOrderDay)
                : value.firstDate
                  ? formatDay(value.firstDate)
                  : value.frequency.kind === "weeks"
                    ? `${value.frequency.every === 1 ? "A week" : `${value.frequency.every} weeks`} after it arrives`
                    : ""}
            </span>
            <button
              type="button"
              onClick={() => setPickingDate((open) => !open)}
              className="h-11 shrink-0 px-1.5 text-[13px] font-semibold text-shop-brown underline underline-offset-[3px]"
            >
              {firstOrder ? "Change date" : value.firstDate ? "Change" : "Pick a day"}
            </button>
          </div>
          {pickingDate && (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                aria-label={firstOrder ? "Day of the first order" : "Day of the first renewal"}
                min={earliest}
                max={latest}
                value={firstOrder ? firstOrderDay : (value.firstDate ?? "")}
                onChange={(event) => setFirstDate(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-xl border border-shop-line bg-white px-3 text-[14px] text-shop-ink"
              />
              {value.firstDate && !firstOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ frequency: value.frequency });
                    setPickingDate(false);
                  }}
                  className="h-11 shrink-0 px-2 text-[13px] font-semibold text-shop-brown"
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
