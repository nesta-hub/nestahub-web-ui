import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { OfferArt } from "./OfferArt";
import { MOBILE_OFFERS, type OfferAction } from "./offers";
import { useAutoAdvance } from "./useAutoAdvance";

/** The signed-in first card keeps the Nesta Hub advert's soft blue: it stands in that advert's place. */
const WELCOME_BG = MOBILE_OFFERS[0].bg;

/** A caption in which `**this**` is bold and `==this==` is in the highlight colour. */
function Caption({ text, highlight }: { text: string; highlight?: string }) {
  return (
    <>
      {text.split(/(\*\*.+?\*\*|==.+?==)/g).map((part, i) => {
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-extrabold text-shop-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.length > 4 && part.startsWith("==") && part.endsWith("==")) {
          return (
            <span key={i} data-highlight className="font-extrabold" style={{ color: highlight }}>
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

/**
 * The swipeable offers under the search bar. It moves on to the next card every few seconds,
 * stops for a while when the shopper touches it, and doesn't move at all for anyone who asks
 * for reduced motion.
 *
 * `welcome` takes the place of the first offer ("Everything for baby and mum") for a signed-in
 * customer: the same advert, with their name on the pill and their wallet as the button. It gets
 * the same slide, so the swiping, the dots and the timing don't change.
 */
export function OffersCarousel({ onAction, welcome }: { onAction: (action: OfferAction) => void; welcome?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  /** The distance from one card to the next, read from the page rather than assumed. */
  const step = () => {
    const cards = track.current?.querySelectorAll<HTMLElement>("[data-offer]");
    return cards && cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
  };

  const goTo = (i: number) => track.current?.scrollTo?.({ left: i * step(), behavior: "smooth" });

  const { pauseFor } = useAutoAdvance(() => goTo((index + 1) % MOBILE_OFFERS.length), 4500);

  const onScroll = () => {
    const s = step();
    if (track.current && s > 0) setIndex(Math.min(MOBILE_OFFERS.length - 1, Math.round(track.current.scrollLeft / s)));
  };

  return (
    <section aria-label="Offers" className="relative">
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={() => pauseFor(9000)}
        onTouchStart={() => pauseFor(9000)}
        className="flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-3.5 scrollbar-hide"
      >
        {MOBILE_OFFERS.map((offer, i) => {
          const className =
            "relative h-44 w-[calc(100vw-40px)] max-w-[350px] flex-none snap-start overflow-hidden rounded-[28px] text-left shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]";
          // A button centres its contents up and down; a link doesn't. Pin the buttons to the top
          // so every card's text starts at the same height, whichever kind of card it is.
          const asBlock = cn(className, "block");
          const asButton = cn(className, "flex flex-col items-start justify-start");
          if (i === 0 && welcome) {
            return (
              <div key="welcome" data-offer data-welcome className={asBlock} style={{ background: WELCOME_BG }}>
                {welcome}
              </div>
            );
          }
          const body = (
            <>
              <OfferArt id={offer.id} />
              <span className="relative flex max-w-[196px] flex-col items-start gap-1.5 pl-5 pt-[18px] text-shop-ink">
                <span
                  className="inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-extrabold leading-3 tracking-[0.14em]"
                  style={{ color: offer.badgeColor }}
                >
                  {offer.badge}
                </span>
                <span className="text-[22px] font-extrabold leading-[26px] tracking-[-0.02em]">{offer.title}</span>
                <span className="text-xs leading-4" style={{ color: offer.subColor }}>
                  <Caption text={offer.sub} highlight={offer.highlightColor} />
                </span>
                {offer.cta && (
                  <span className="mt-1 inline-flex h-[34px] items-center gap-2 rounded-full bg-shop-ink pl-3.5 pr-[5px] text-[12.5px] font-bold leading-4 text-shop-cream">
                    {offer.cta}
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-shop-cream text-shop-ink">
                      <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  </span>
                )}
              </span>
            </>
          );
          // Going to another page is a link; showing a group on this page is a button.
          return offer.action.kind === "link" ? (
            <Link key={offer.id} to={offer.action.to} data-offer className={asBlock} style={{ background: offer.bg }}>
              {body}
            </Link>
          ) : (
            <button key={offer.id} type="button" data-offer onClick={() => onAction(offer.action)} className={asButton} style={{ background: offer.bg }}>
              {body}
            </button>
          );
        })}
        <span aria-hidden="true" className="w-2 flex-none" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-[5px]">
        {MOBILE_OFFERS.map((offer, i) => (
          <span
            key={offer.id}
            className={cn("h-[5px] rounded-[3px] transition-all duration-300", i === index ? "w-[18px] bg-shop-ink" : "w-1.5 bg-[rgba(51,38,28,0.28)]")}
          />
        ))}
      </div>
    </section>
  );
}
