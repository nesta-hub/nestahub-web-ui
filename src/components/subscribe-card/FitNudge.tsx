import { useState } from "react";
import type { RenewalFrequency } from "@/lib/subscriptionBoxes";
import { monthFitNudge, type FitNudge as Nudge } from "@/lib/subscriptionFit";

interface Props {
  frequency: RenewalFrequency;
  recommendedFrequencyWeeks: number | null | undefined;
  quantity: number;
}

/** The month check's words: a question in bold, then how long it lasts against a month, then what would fit. */
function monthCheckText(nudge: Nudge, quantity: number): { title: string; text: string } {
  const packs = quantity === 1 ? "One pack lasts" : `${quantity} packs last`;
  const every = nudge.lastsWeeks === 1 ? "Every week" : `Every ${nudge.lastsWeeks} weeks`;
  const lasts = `${packs} about ${nudge.lastsWeeks * 7} days, and a month is 30.`;
  return nudge.kind === "runs_out"
    ? { title: "Sure this will last a month?", text: `${lasts} ${every} keeps you covered.` }
    : { title: "Sure you need it every month?", text: `${lasts} ${every} may suit you better.` };
}

/**
 * "Sure this will last a month?": the Subscribe screens' version of the hint, for a monthly choice that does not
 * match how long what she buys lasts. "Ignore" hides it until she changes how often, or how many.
 */
export function MonthCheck({ frequency, recommendedFrequencyWeeks, quantity }: Props) {
  const [ignored, setIgnored] = useState<string | null>(null);
  const nudge = monthFitNudge(frequency, recommendedFrequencyWeeks, quantity);
  const key = `${JSON.stringify(frequency)}|${quantity}|${recommendedFrequencyWeeks ?? ""}`;
  if (!nudge || ignored === key) return null;
  const { title, text } = monthCheckText(nudge, quantity);
  return (
    <div role="status" className="rounded-[18px] bg-[#EEDFD2] px-3.5 pb-1.5 pt-3">
      <p className="text-[13px] leading-[18px] text-[#4F4338]">
        <b className="font-extrabold">{title}</b> {text}
      </p>
      <button
        type="button"
        onClick={() => setIgnored(key)}
        className="-ml-2 block h-11 px-2 text-[13px] font-bold text-shop-brown underline underline-offset-[3px]"
      >
        Ignore
      </button>
    </div>
  );
}
