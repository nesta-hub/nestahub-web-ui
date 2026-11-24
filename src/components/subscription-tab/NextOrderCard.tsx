import { ArrowRight, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { describePlace, formatDay, type Box } from "@/lib/subscriptionBoxes";
import { cn } from "@/lib/utils";
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
}

const chip = "inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-extrabold leading-3 tracking-[0.14em] text-[#46564A]";
/** The four buttons under the total: two by two, each 48px tall. */
const option =
  "flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-3xl bg-white/[0.72] px-2.5 text-[14px] font-extrabold leading-[18px] text-shop-ink disabled:opacity-50";

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

/** What is in the box, one line each: "Kisskids diapers ×2". Something she added just for this order says "(extra)"; an item on its first delivery says "(new)". */
function Lines({ box }: { box: Box }) {
  return (
    <>
      {box.items.map((l) => (
        <span key={l.id} className="block">
          {`${l.productName} ×${l.quantity}`}
          {l.kind === "one_time" ? " (extra)" : l.firstTime ? " (new)" : ""}
        </span>
      ))}
    </>
  );
}

/** The card's top: the chip, the day, where it goes, and what is in it. Shared by an order she can pay and one she skipped. */
function CardTop({ chip: chipText, date, box, onChangeLocation }: { chip: string; date: string; box: Box; onChangeLocation: () => void }) {
  return (
    <>
      <span className={chip}>{chipText}</span>
      <h2 className="mt-2 text-[32px] font-extrabold leading-[38px] tracking-[-0.025em] text-shop-ink">{date}</h2>

      <button type="button" onClick={onChangeLocation} disabled={!box.editable} className="mt-0.5 flex items-center gap-1.5 text-left text-[14px] leading-5 text-[#34443A] disabled:cursor-default">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className={cn(box.needsDelivery && "font-extrabold underline underline-offset-2")}>{describePlace(box.delivery)}</span>
      </button>

      <div className="mt-3.5 flex items-center gap-3 rounded-[18px] bg-white/[0.72] px-3 py-2.5">
        <Pictures box={box} />
        <span className="min-w-0 flex-1 text-[13px] font-bold leading-[18px] text-shop-ink"><Lines box={box} /></span>
      </div>
    </>
  );
}

/**
 * One order she can pay: the day, where it goes, what is in it, what it costs, and what she
 * can do. Once she has said she paid, or it is paid, the buttons give way to a plain status.
 */
export function NextOrderCard({ box, first, busy, onPay, onMakeChanges, onSkip, onAddExtras, onChangeLocation }: Props) {
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
        <CardTop chip={paid ? "PAID" : first ? "NEXT ORDER" : "LATER ORDER"} date={formatDay(box.deliveryDate)} box={box} onChangeLocation={onChangeLocation} />

        {box.needsDelivery ? (
          <div className="mt-3.5">
            <p className="text-[13px] leading-[18px] text-[#34443A]">Tell us where to deliver, then you can pay.</p>
            <button type="button" onClick={onChangeLocation} className="mt-3 flex h-14 w-full items-center justify-center rounded-[28px] bg-shop-cta hover:bg-shop-cta-hover text-[15px] font-extrabold text-shop-cream">
              Add a delivery address
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3.5 flex items-end justify-between gap-3">
              <span>
                <span className="block text-[12px] font-bold leading-4 text-[#46564A]">Total</span>
                <span className="block text-[28px] font-extrabold leading-8 tracking-[-0.02em] tabular-nums text-shop-ink">
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
            <b className="font-extrabold text-shop-ink">Payment made.</b> We are confirming it. This usually takes a few minutes.
          </p>
        )}
        {paid && (
          <p role="status" className="mt-4 rounded-[18px] bg-white/[0.72] px-4 py-3 text-[13px] leading-[18px] text-[#34443A]">
            <b className="font-extrabold text-shop-ink">{box.status === "delivered" ? "Delivered." : "Paid."}</b> {box.status === "delivered" ? "Thank you." : `It is coming ${formatDay(box.deliveryDate)}.`}
          </p>
        )}

        {box.editable && !box.needsDelivery && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPay}
              disabled={busy || !box.canPay}
              className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-3xl bg-shop-ink px-2.5 text-[14px] font-extrabold leading-[18px] text-shop-cream disabled:opacity-60"
            >
              <span>{box.order ? "Continue to pay" : "Pay now"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
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
            <b className="font-extrabold text-shop-ink">You skipped {formatDay(box.deliveryDate)}.</b>
            {nextOrder ? ` Your next order is ${formatDay(nextOrder)}.` : ""}
          </p>
          {box.canUndoSkip && (
            <button type="button" onClick={onUndo} disabled={busy} className="h-11 shrink-0 px-2.5 text-[13px] font-bold text-shop-brown underline underline-offset-[3px] disabled:opacity-50">
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
        <b className="font-extrabold text-shop-ink">You skipped {formatDay(box.deliveryDate)}.</b>
        {nextOrder ? ` Your next order is ${formatDay(nextOrder)}.` : ""}
      </p>
      {box.canUndoSkip && (
        <button type="button" onClick={onUndo} disabled={busy} className="h-11 shrink-0 px-2.5 text-[13px] font-bold text-shop-brown underline underline-offset-[3px] disabled:opacity-50">
          Undo
        </button>
      )}
    </section>
  );
}
