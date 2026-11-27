import { ArrowRight, Check, MapPin, Minus } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { brandedName, describePlace, formatDay, type Box } from "@/lib/subscriptionBoxes";
import { cn } from "@/lib/utils";
import { METHOD_LABEL } from "./deliveryMethods";
import { Thumb } from "./Thumb";

interface Props {
  box: Box;
  /** Called "NEXT ORDER" when true, "LATER ORDER" otherwise. */
  first: boolean;
  busy: boolean;
  onPay: () => void;
  onMakeChanges: () => void;
  onSkip: () => void;
  /** Start shopping for extra items to add to this order. */
  onAddExtras: () => void;
  onChangeLocation: () => void;
  /** Take a one-time extra out of this order. */
  onRemoveExtra?: (lineId: string) => void;
}

const chip = "inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-bold leading-3 tracking-[0.14em] text-[#46564A]";
/** The four buttons under the total: two by two, each 48px tall. */
const option =
  "flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-3xl bg-white/[0.72] px-2.5 text-[14px] font-semibold leading-[18px] text-shop-ink disabled:opacity-50";

/** The pictures of what is in the box, overlapping. */
function Pictures({ box }: { box: Box }) {
  const shown = box.items.slice(0, 3);
  return (
    <span className="flex items-center">
      {shown.map((line, i) => (
        <span key={line.id} className={cn("h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#EFEAE4] ring-2 ring-[#EEF1EB]", i > 0 && "-ml-2.5")}>
          <Thumb src={line.imageUrl} />
        </span>
      ))}
    </span>
  );
}

/**
 * What is in the box, one item each: "Kisskids Baby Wipes ×1", with its size or type under it. Something she added just
 * for this order says "(extra)" and, while the order can still change, has a red minus to take it out; an item on its
 * first delivery says "(new)".
 */
function Lines({ box, busy, onRemoveExtra }: { box: Box; busy?: boolean; onRemoveExtra?: (lineId: string) => void }) {
  return (
    <span className="flex flex-col gap-1.5">
      {box.items.map((l) => {
        const removable = l.kind === "one_time" && box.editable && !!onRemoveExtra;
        return (
          <span key={l.id} className="flex items-start gap-2">
            <span className="block min-w-0 flex-1">
              <span className="block">
                {`${brandedName(l.brand, l.productName)} ×${l.quantity}`}
                {l.kind === "one_time" ? " (extra)" : l.firstTime ? " (new)" : ""}
              </span>
              {l.variantLabel && <span className="block text-[12px] font-medium leading-4 text-[#46564A]">{l.variantLabel}</span>}
            </span>
            {removable && (
              <button
                type="button"
                aria-label={`Remove ${l.productName} (extra)`}
                disabled={busy}
                onClick={() => onRemoveExtra(l.id)}
                className="-my-1.5 -mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center disabled:opacity-40"
              >
                <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D14343] text-white">
                  <Minus className="h-3 w-3" strokeWidth={3} />
                </span>
              </button>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** How it reaches her, then where: "Community Delivery: 12 Ifako St", "Pick-up: Yaba station". */
function Place({ box }: { box: Box }) {
  const { type, address, pickupStationName } = box.delivery;
  if (!type) return <>{describePlace(box.delivery)}</>;
  const where = type === "pickup" ? (pickupStationName ?? "your station") : (address ?? "Your saved address");
  return (
    <>
      <span className="font-semibold text-shop-ink">{METHOD_LABEL[type]}:</span> {where}
    </>
  );
}

/** The card's top: the chip, the day, where it goes, and what is in it. Shared by an order she can pay and one she skipped. */
function CardTop({
  chip: chipText,
  date,
  box,
  onChangeLocation,
  busy,
  onRemoveExtra,
}: {
  chip: string;
  date: string;
  box: Box;
  onChangeLocation: () => void;
  busy?: boolean;
  onRemoveExtra?: (lineId: string) => void;
}) {
  return (
    <>
      <span className={chip}>{chipText}</span>
      <h2 className="mt-2 text-[32px] font-bold leading-[38px] tracking-[-0.025em] text-shop-ink">{date}</h2>

      <button type="button" onClick={onChangeLocation} disabled={!box.editable} className="mt-1.5 flex items-start gap-1.5 text-left text-[14px] leading-5 text-[#34443A] disabled:cursor-default">
        <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className={cn("line-clamp-2 min-w-0", box.needsDelivery && "font-semibold underline underline-offset-2")}>
          <Place box={box} />
        </span>
      </button>

      <div className="mt-3.5 flex items-center gap-3 rounded-[18px] bg-white/[0.72] px-3 py-2.5">
        <Pictures box={box} />
        <span className="min-w-0 flex-1 text-[13px] font-semibold leading-[18px] text-shop-ink"><Lines box={box} busy={busy} onRemoveExtra={onRemoveExtra} /></span>
      </div>
    </>
  );
}

/**
 * One order she can pay: the day, where it goes, what is in it, what it costs, and what she
 * can do. Once she has said she paid, or it is paid, the buttons give way to a plain status.
 */
export function NextOrderCard({ box, first, busy, onPay, onMakeChanges, onSkip, onAddExtras, onChangeLocation, onRemoveExtra }: Props) {
  const confirming = box.order?.status === "payment_made";
  const paid = box.status === "paid" || box.status === "delivered";
  const fee = box.deliveryFeeKobo;

  return (
    <section
      aria-label={first ? "Next order" : `Order on ${formatDay(box.deliveryDate)}`}
      className="relative overflow-hidden rounded-[28px] bg-[#DDE3DA] p-5 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]"
    >
      <span aria-hidden="true" className="absolute -right-12 -top-16 h-[200px] w-[200px] rounded-full bg-[#E6EBE3]" />
      <div className="relative">
        <CardTop chip={paid ? "PAID" : first ? "NEXT ORDER" : "LATER ORDER"} date={formatDay(box.deliveryDate)} box={box} onChangeLocation={onChangeLocation} busy={busy} onRemoveExtra={onRemoveExtra} />

        {box.needsDelivery ? (
          <div className="mt-3.5">
            <p className="text-[13px] leading-[18px] text-[#34443A]">Tell us where to deliver, then you can pay.</p>
            <button type="button" onClick={onChangeLocation} className="mt-3 flex h-14 w-full items-center justify-center rounded-[28px] bg-shop-cta hover:bg-shop-cta-hover text-[15px] font-bold text-shop-cream">
              Add a delivery address
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3.5 flex items-end justify-between gap-3">
              <span>
                <span className="block text-[12px] font-semibold leading-4 text-[#46564A]">Total</span>
                <span className="block text-[28px] font-bold leading-8 tracking-[-0.02em] tabular-nums text-shop-ink">
                  {box.totalKobo === null ? "—" : formatPrice(box.totalKobo)}
                </span>
              </span>
              <span className="text-right text-[13px] leading-[19px] tabular-nums text-[#34443A]">
                <span className="block">Items {formatPrice(box.subtotalKobo)}</span>
                <span className="block">Delivery {fee === null ? "—" : fee === 0 ? "Free" : formatPrice(fee)}</span>
              </span>
            </div>
          </>
        )}

        {confirming && (
          <p role="status" className="mt-4 rounded-[18px] bg-white/[0.72] px-4 py-3 text-[13px] leading-[18px] text-[#34443A]">
            <b className="font-semibold text-shop-ink">Payment made.</b> We are confirming it. This usually takes a few minutes.
          </p>
        )}
        {paid && (
          <p role="status" className="mt-4 flex items-center gap-2.5 rounded-[18px] bg-white/[0.72] px-4 py-3 text-[13px] leading-[18px] text-[#34443A]">
            <span aria-hidden="true" data-testid="paid-check" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2F8F4E] text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>
              <b className="font-semibold text-shop-ink">{box.status === "delivered" ? "Delivered." : "Paid."}</b> {box.status === "delivered" ? "Thank you." : `It is coming ${formatDay(box.deliveryDate)}.`}
            </span>
          </p>
        )}

        {box.editable && !box.needsDelivery && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPay}
              disabled={busy || !box.canPay}
              className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-3xl bg-shop-ink px-2.5 text-[14px] font-bold leading-[18px] text-shop-cream disabled:opacity-60"
            >
              <span>{box.order ? "Continue to pay" : "Pay now"}</span>
              {!box.order && <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />}
            </button>
            <button type="button" onClick={onMakeChanges} disabled={busy} className={option}>
              Make changes
            </button>
            <button type="button" onClick={onSkip} disabled={busy} className={option}>
              Skip
            </button>
            <button type="button" onClick={onAddExtras} disabled={busy} className={option}>
              Add extra items
            </button>
          </div>
        )}
        {box.editable && box.needsDelivery && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={onMakeChanges} disabled={busy} className={option}>
              Make changes
            </button>
            <button type="button" onClick={onSkip} disabled={busy} className={option}>
              Skip
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * An order she skipped. When nothing else is coming up, it stays on the page as the next-order card, now showing the
 * day her next order is due, with a line saying what happened and a way to take it back.
 */
export function SkippedOrderCard({ box, nextOrder, busy, onUndo, onChangeLocation }: { box: Box; nextOrder: string | null; busy: boolean; onUndo: () => void; onChangeLocation: () => void }) {
  return (
    <section
      aria-label="Skipped order"
      className="relative overflow-hidden rounded-[28px] bg-[#DDE3DA] p-5 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]"
    >
      <span aria-hidden="true" className="absolute -right-12 -top-16 h-[200px] w-[200px] rounded-full bg-[#E6EBE3]" />
      <div className="relative">
        <CardTop chip={nextOrder ? "NEXT ORDER" : "SKIPPED"} date={formatDay(nextOrder ?? box.deliveryDate)} box={{ ...box, editable: false }} onChangeLocation={onChangeLocation} />
        <div className="mt-3.5 flex items-center justify-between gap-2 rounded-[18px] bg-white/[0.72] py-1.5 pl-3.5 pr-1.5">
          <p className="text-[13px] leading-[18px] text-[#34443A]">
            <b className="font-semibold text-shop-ink">You skipped {formatDay(box.deliveryDate)}.</b>
            {nextOrder ? ` Your next order is ${formatDay(nextOrder)}.` : ""}
          </p>
          {box.canUndoSkip && (
            <button type="button" onClick={onUndo} disabled={busy} className="h-11 shrink-0 px-2.5 text-[13px] font-semibold text-shop-brown underline underline-offset-[3px] disabled:opacity-50">
              Undo
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** A skipped order when another order is already waiting below it: just the line and the way back. */
export function SkippedCard({ box, nextOrder, busy, onUndo }: { box: Box; nextOrder: string | null; busy: boolean; onUndo: () => void }) {
  return (
    <section aria-label="Skipped order" className="flex items-center justify-between gap-2 rounded-[22px] bg-[#DDE3DA] py-2.5 pl-4 pr-2 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]">
      <p className="text-[13px] leading-[18px] text-[#34443A]">
        <b className="font-semibold text-shop-ink">You skipped {formatDay(box.deliveryDate)}.</b>
        {nextOrder ? ` Your next order is ${formatDay(nextOrder)}.` : ""}
      </p>
      {box.canUndoSkip && (
        <button type="button" onClick={onUndo} disabled={busy} className="h-11 shrink-0 px-2.5 text-[13px] font-semibold text-shop-brown underline underline-offset-[3px] disabled:opacity-50">
          Undo
        </button>
      )}
    </section>
  );
}
