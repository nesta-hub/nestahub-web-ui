import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RenewalFrequency } from "@/lib/subscriptionBoxes";
import { MAX_WEEKS, NTH_CHOICES, WEEKDAY_SHORT, describeFrequency, ordinal, switchKind } from "@/lib/renewalFrequency";

interface Props {
  value: RenewalFrequency;
  onChange: (next: RenewalFrequency) => void;
}

/** A round - or + button. */
function Step({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-shop-line-soft bg-white text-shop-ink",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/** A bar with - and + either side of a line of text: "Every 4 weeks", "On the 25th". */
function Stepper({ text, onDown, onUp, downDisabled, downLabel, upLabel }: { text: string; onDown: () => void; onUp: () => void; downDisabled?: boolean; downLabel: string; upLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[30px] border border-[#EDE8E3] bg-shop-page p-[5px]">
      <Step label={downLabel} onClick={onDown} disabled={downDisabled}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Step>
      <span className="min-w-0 flex-1 text-center text-[17px] font-bold leading-6 tabular-nums text-shop-ink" aria-live="polite">{text}</span>
      <Step label={upLabel} onClick={onUp}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Step>
    </div>
  );
}

/** One of the three ways to renew: a radio row that opens its controls when chosen. */
function Choice({ selected, title, onPick, children }: { selected: boolean; title: string; onPick: () => void; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[20px] border px-3.5", selected ? "border-[#A08B76] bg-[#A08B76]/10" : "border-[#E5E0DC] bg-transparent")}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onPick}
        className="flex h-[52px] w-full items-center gap-3 text-left text-[14.5px] font-semibold text-shop-ink"
      >
        <span aria-hidden="true" className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2", selected ? "border-[#A08B76]" : "border-[#CFC6BC]")}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#A08B76]" />}
        </span>
        <span>{title}</span>
      </button>
      {selected && <div className="pb-3.5 pt-0.5">{children}</div>}
    </div>
  );
}

/** A pill in the day choice: 14px for 1st…Last, 12.5px for the seven weekdays so they fit. */
function Pill({ label, pressed, onClick, small }: { label: string; pressed: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-10 rounded-[20px] border font-medium",
        small ? "text-[12.5px]" : "text-[14px]",
        pressed ? "border-[#A08B76] bg-[#A08B76]/10 text-[#A08B76]" : "border-[#E5E0DC] bg-transparent text-shop-ink",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Renewal frequency, three ways: every few weeks, on a date each month, or on a day each
 * month (the 2nd Tuesday, the last Friday). Only the chosen way shows its controls.
 */
export function RenewalFrequencyPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Renewal frequency" className="flex flex-col gap-2">
      <Choice selected={value.kind === "weeks"} title="Every few weeks" onPick={() => onChange(switchKind(value, "weeks"))}>
        {value.kind === "weeks" && (
          <Stepper
            text={describeFrequency(value)}
            downLabel="Fewer weeks"
            upLabel="More weeks"
            downDisabled={value.every <= 1}
            onDown={() => onChange({ kind: "weeks", every: Math.max(1, value.every - 1) })}
            onUp={() => onChange({ kind: "weeks", every: Math.min(MAX_WEEKS, value.every + 1) })}
          />
        )}
      </Choice>

      <Choice selected={value.kind === "month_date"} title="Monthly, on a particular date" onPick={() => onChange(switchKind(value, "month_date"))}>
        {value.kind === "month_date" && (
          <Stepper
            text={`On the ${ordinal(value.day)}`}
            downLabel="Earlier date"
            upLabel="Later date"
            onDown={() => onChange({ kind: "month_date", day: value.day <= 1 ? 31 : value.day - 1 })}
            onUp={() => onChange({ kind: "month_date", day: value.day >= 31 ? 1 : value.day + 1 })}
          />
        )}
      </Choice>

      <Choice selected={value.kind === "month_weekday"} title="Monthly, on a particular day" onPick={() => onChange(switchKind(value, "month_weekday"))}>
        {value.kind === "month_weekday" && (
          <>
            <div className="grid grid-cols-5 gap-1.5">
              {NTH_CHOICES.map((n) => (
                <Pill key={n.value} label={n.label} pressed={value.nth === n.value} onClick={() => onChange({ ...value, nth: n.value })} />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {WEEKDAY_SHORT.map((label, i) => (
                <Pill key={label} small label={label} pressed={value.weekday === i + 1} onClick={() => onChange({ ...value, weekday: i + 1 })} />
              ))}
            </div>
          </>
        )}
      </Choice>

      {value.kind !== "weeks" && <p className="mt-0.5 text-[13px] font-semibold leading-[18px] text-[#46564A]">{describeFrequency(value)}</p>}
    </div>
  );
}
