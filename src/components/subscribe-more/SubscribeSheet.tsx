import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { SubscribeChoiceFields } from "@/components/subscribe-card/SubscribeChoiceFields";
import { startingChoice, type SubscribeChoice } from "@/components/subscribe-card/choice";
import { BigButton, BottomSheet } from "@/components/subscription-tab/BottomSheet";
import { formatPrice } from "@/lib/api";
import { describeFrequencyInSentence } from "@/lib/renewalFrequency";
import { brandedName, type CatalogItem, type EnrolInput } from "@/lib/subscriptionBoxes";
import { GENERIC_FAILURE, enrolInput, priceFor } from "./helpers";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

/** What trying to subscribe came to: it worked, or here is what to tell her. (Not a union: this project does not narrow those.) */
export interface EnrolOutcome {
  ok: boolean;
  message?: string;
}

interface Props {
  item: CatalogItem;
  open: boolean;
  onClose: () => void;
  onSubscribe: (input: EnrolInput) => Promise<EnrolOutcome>;
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const button = "flex h-11 w-11 items-center justify-center rounded-full border border-shop-line-soft bg-white disabled:opacity-40";
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Fewer" className={button} disabled={value <= MIN_QUANTITY} onClick={() => onChange(value - 1)}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-10 text-center text-[24px] font-bold leading-8 tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="More" className={button} disabled={value >= MAX_QUANTITY} onClick={() => onChange(value + 1)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The bottom sheet for subscribing to one thing she has not bought yet: how many, how often, the first day, then Subscribe.
 * The page gives it a fresh copy each time it opens, so it always starts from the item's own suggestion.
 */
export function SubscribeSheet({ item, open, onClose, onSubscribe }: Props) {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [choice, setChoice] = useState<SubscribeChoice>(() => startingChoice(item.recommendedFrequencyWeeks, MIN_QUANTITY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { payKobo } = priceFor(item);

  const subscribe = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const outcome = await onSubscribe(enrolInput(item, quantity, choice));
      if (!outcome.ok) setError(outcome.message ?? GENERIC_FAILURE);
    } catch {
      setError(GENERIC_FAILURE);
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="flex items-center gap-3 pb-1">
      <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-[19px]">{brandedName(item.brand, item.productName)}</span>
        {item.variantLabel && <span className="mt-px block text-[12.5px] leading-[17px] text-[#6B5F55]">{item.variantLabel}</span>}
      </span>
    </div>
  );

  const footer = (
    <>
      {(error || item.subscribed) && (
        <p role="alert" className="mb-2.5 text-center text-[13px] font-semibold leading-[18px] text-[#9A4A3A]">
          {error ?? "You already subscribe to this one."}
          {item.subscribed && (
            <>
              {" "}
              <Link to="/subscriptions" className="underline underline-offset-2">
                See your subscription
              </Link>
            </>
          )}
        </p>
      )}
      <BigButton busy={busy} disabled={item.subscribed} onClick={() => void subscribe()}>
        Subscribe
      </BigButton>
    </>
  );

  return (
    <BottomSheet open={open} onClose={() => !busy && onClose()} title={`Subscribe to ${brandedName(item.brand, item.productName)}`} header={header} footer={footer}>
      <div className="space-y-5 border-t border-[#EEE8E1] pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold">Quantity</p>
          <Stepper value={quantity} onChange={setQuantity} />
        </div>

        <div>
          <p className="mb-2.5 text-[15px] font-semibold">How often</p>
          <SubscribeChoiceFields value={choice} onChange={setChoice} firstOrder />
        </div>

        <div>
          <p className="text-[15px] font-semibold leading-5">
            {formatPrice(payKobo)} each, {describeFrequencyInSentence(choice.frequency)}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-[17px] text-shop-muted">We remind you before each one is due. You pay only when you say yes.</p>
        </div>
      </div>
    </BottomSheet>
  );
}
