import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { apiProductToCatalogue } from "@/lib/catalogueAdapter";
import type { RenewalFrequency, SubscribedItem } from "@/lib/subscriptionBoxes";
import { sameFrequency } from "@/lib/renewalFrequency";
import { BigButton, BottomSheet, MenuRow, TextButton } from "./BottomSheet";
import { MonthCheck } from "@/components/subscribe-card/FitNudge";
import { RenewalFrequencyPicker } from "./RenewalFrequencyPicker";
import { VariantPicker } from "./VariantPicker";
import { choosableView, pickText, selectionOf, variantFor } from "./variantChoices";

type View = "menu" | "quantity" | "size" | "frequency" | "pause" | "stop";

const MAX_QUANTITY = 20;

interface Props {
  item: SubscribedItem | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onQuantity: (quantity: number) => Promise<boolean>;
  onVariant: (variantId: string) => Promise<boolean>;
  onFrequency: (frequency: RenewalFrequency) => Promise<boolean>;
  onPause: () => Promise<boolean>;
  onResume: () => Promise<boolean>;
  onStop: () => Promise<boolean>;
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const button = "flex h-11 w-11 items-center justify-center rounded-full border border-shop-line-soft bg-white disabled:opacity-40";
  return (
    <div className="flex items-center justify-center gap-3.5">
      <button type="button" aria-label="Fewer" className={button} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-12 text-center text-[30px] font-extrabold leading-9 tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="More" className={button} disabled={value >= MAX_QUANTITY} onClick={() => onChange(value + 1)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** A menu row's icon, drawn as the design draws it. */
function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/** One subscribed item: what she can change about it, and a way to pause or stop it. */
export function ItemDrawer({ item, open, busy, onClose, onQuantity, onVariant, onFrequency, onPause, onResume, onStop }: Props) {
  const [view, setView] = useState<View>("menu");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<RenewalFrequency>({ kind: "weeks", every: 4 });
  /** What is picked in each group (Type, Size...) on the change-size screen. */
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !item) return;
    setView("menu");
    setQuantity(item.quantity);
    setFrequency(item.frequency);
    setSelected({});
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The sizes of this product, only when she asks to change size.
  const { data: product } = useQuery({
    queryKey: ["product-for-sizes", item?.slug],
    queryFn: () => api.getProduct(item!.slug as string),
    enabled: open && view === "size" && !!item?.slug,
  });

  if (!item) return null;
  const paused = item.status === "paused";
  // The product as far as a subscription goes. She starts on what she has now; each tap changes one group.
  const choices = product ? choosableView(product) : null;
  const current = product?.variants.find((v) => v.id === item.variantId);
  const picked = choices && Object.keys(selected).length === 0 ? selectionOf(current) : selected;
  const chosen = choices ? variantFor(choices, picked) : undefined;

  const finish = async (work: Promise<boolean>) => {
    if (await work) onClose();
  };

  // The drawer body starts 8px down, so a panel's title takes mt-3 to sit 20px under the item, as in the design.
  const header = (
    <div className="flex items-center gap-3">
      <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold leading-[19px]">{item.productName}</span>
        <span className="mt-px block text-[12.5px] leading-[17px] text-[#6B5F55]">{[item.variantLabel, `×${item.quantity}`].filter(Boolean).join(" · ")}</span>
      </span>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={item.productName} header={header}>
      {view === "menu" && (
        <div className="mt-0.5 border-t border-[#EEE8E1]">
          <MenuRow icon={<MenuIcon><path d="M5 12h14" /><path d="M12 5v14" /></MenuIcon>} label="Change quantity" detail={`×${item.quantity}`} onClick={() => setView("quantity")} />
          {item.slug && (
            <MenuRow icon={<MenuIcon><path d="M21 7 7 21" /><path d="M3 3h6v6" /><path d="M21 21h-6v-6" /></MenuIcon>} label="Change size" detail={item.variantLabel ?? undefined} onClick={() => setView("size")} />
          )}
          <MenuRow
            icon={<MenuIcon><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></MenuIcon>}
            label="Change renewal frequency"
            detail={item.frequencyLabel}
            onClick={() => setView("frequency")}
          />
          <MenuRow
            icon={<MenuIcon>{paused ? <path d="M7 4.5v15l12-7.5z" /> : <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>}</MenuIcon>}
            label={paused ? "Resume" : "Pause"}
            detail={paused ? "Paused" : "Active"}
            onClick={() => setView("pause")}
          />
          <MenuRow icon={<MenuIcon><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></MenuIcon>} label="Stop subscription" danger onClick={() => setView("stop")} />
        </div>
      )}

      {view === "quantity" && (
        <div>
          <p className="mb-3 mt-3 text-[17px] font-extrabold leading-[23px]">Change quantity</p>
          <Stepper value={quantity} onChange={setQuantity} />
          <p className="mt-3 text-center text-[12.5px] leading-[18px] text-[#6B5F55]">This changes your next order and the ones after it.</p>
          <div className="mt-[18px]">
            <BigButton busy={busy} disabled={quantity === item.quantity} onClick={() => finish(onQuantity(quantity))}>Save</BigButton>
          </div>
        </div>
      )}

      {view === "size" && (
        <div>
          <p className="mb-1 mt-3 text-[17px] font-extrabold leading-[23px]">Change size</p>
          <p className="mb-3.5 text-[12.5px] leading-[18px] text-[#6B5F55]">
            {choices && choices.variants.length > 0 ? `${pickText(apiProductToCatalogue(choices).attributes.map((a) => a.name))} ` : ""}This changes your next order and the ones after it.
          </p>
          {!choices ? (
            <p className="text-[13px] text-[#6B5F55]">Loading sizes…</p>
          ) : choices.variants.length === 0 ? (
            <p className="text-[13px] text-[#6B5F55]">There are no other sizes you can subscribe to.</p>
          ) : (
            <VariantPicker detail={choices} selected={picked} onChange={setSelected} />
          )}
          <div className="mt-5">
            <BigButton busy={busy} disabled={!chosen || chosen.id === item.variantId} onClick={() => chosen && finish(onVariant(chosen.id))}>
              Save
            </BigButton>
          </div>
        </div>
      )}

      {view === "frequency" && (
        <div>
          <p className="mt-3 text-[17px] font-extrabold leading-[23px]">Change renewal frequency</p>
          <div className="mb-2.5 mt-3 flex items-baseline justify-between gap-2">
            <span className="text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-[#6B5F55]">Renewal frequency</span>
          </div>
          <RenewalFrequencyPicker value={frequency} onChange={setFrequency} />
          <div className="mt-3 empty:hidden">
            <MonthCheck frequency={frequency} recommendedFrequencyWeeks={item.recommendedFrequencyWeeks} quantity={item.quantity} />
          </div>
          <div className="mt-4">
            <BigButton busy={busy} disabled={sameFrequency(frequency, item.frequency)} onClick={() => finish(onFrequency(frequency))}>Save</BigButton>
          </div>
        </div>
      )}

      {view === "pause" && (
        <div>
          <p className="mt-3 text-[17px] font-extrabold leading-[23px]">{paused ? `Resume ${item.productName}?` : `Pause ${item.productName}?`}</p>
          <p className="mt-1.5 text-[13.5px] leading-5 text-[#5A4E44]">{paused ? "It will come back in your next order." : "We will leave it out of your orders until you resume it."}</p>
          <div className="mt-4">
            <BigButton busy={busy} onClick={() => finish(paused ? onResume() : onPause())}>{paused ? "Resume" : "Pause"}</BigButton>
          </div>
          <TextButton onClick={onClose}>Never mind</TextButton>
        </div>
      )}

      {view === "stop" && (
        <div>
          <p className="mt-3 text-[17px] font-extrabold leading-[23px]">Stop subscribing to {item.productName}?</p>
          <p className="mt-1.5 text-[13.5px] leading-5 text-[#5A4E44]">It will not come in your next order. You can subscribe again any time.</p>
          <div className="mt-4">
            <BigButton tone="danger" busy={busy} onClick={() => finish(onStop())}>Stop subscription</BigButton>
          </div>
          <TextButton onClick={onClose}>Keep it</TextButton>
        </div>
      )}
    </BottomSheet>
  );
}
