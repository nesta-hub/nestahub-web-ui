import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_OFFERS, type MobileOffer, type OfferAction } from "./offers";
import { useAutoAdvance } from "./useAutoAdvance";
import nestaLogo from "@/assets/nesta-logo.png";
import alphabetSet from "@/assets/shop/offers/alphabet-set.webp";
import ringStack from "@/assets/shop/offers/ring-stack.webp";
import heroBaby from "@/assets/shop/offers/hero-baby.webp";
import toteBag from "@/assets/shop/offers/tote-bag.webp";
import tumbler from "@/assets/shop/offers/tumbler.webp";

const SHADOW = "drop-shadow-[0_6px_8px_rgba(51,38,28,0.28)]";

function OfferArt({ id }: { id: MobileOffer["id"] }) {
  if (id === "shop") {
    return (
      <img
        src={heroBaby}
        alt=""
        className="absolute right-3 top-5 h-[132px] w-[132px] rotate-2 rounded-[26px] object-cover shadow-[0_18px_30px_-18px_rgba(51,38,28,0.5)]"
      />
    );
  }
  if (id === "toys") {
    return (
      <>
        <span
          aria-hidden="true"
          className="absolute right-3 top-5 h-[136px] w-[136px] rounded-full bg-[#F7F2E9] shadow-[0_16px_26px_-18px_rgba(51,38,28,0.45),inset_0_0_0_1px_rgba(255,255,255,0.7)]"
        />
        <img src={alphabetSet} alt="" className={cn("absolute right-[62px] top-[42px] h-[98px] -rotate-6", SHADOW)} />
        <img src={ringStack} alt="" className={cn("absolute right-[26px] top-7 h-[120px] rotate-[5deg]", SHADOW)} />
      </>
    );
  }
  if (id === "referrals") {
    return (
      <>
        <img
          src={tumbler}
          alt=""
          className="absolute right-3 top-5 h-[132px] w-[132px] rotate-3 rounded-[26px] object-cover shadow-[0_18px_30px_-18px_rgba(51,38,28,0.5)]"
        />
        <img src={toteBag} alt="" className={cn("absolute right-[96px] top-[58px] z-[1] h-[100px] -rotate-[5deg]", SHADOW)} />
      </>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2 top-[46px] h-[85px] w-[136px] -rotate-[5deg] scale-[0.86] overflow-hidden rounded-[14px] text-[#324461] shadow-[0_10px_18px_-10px_rgba(51,38,28,0.45)]"
      style={{ background: "linear-gradient(135deg,#E8EEF5,#CFDCEB,#E8EEF5)" }}
    >
      <img src={nestaLogo} alt="" className="absolute left-2 top-1.5 h-[26px] w-auto" />
      <span className="absolute left-2 top-[34px] text-[6.5px] font-semibold tracking-[0.14em] opacity-50">GIFT CARD</span>
      <span className="absolute inset-x-0 top-[44px] text-center text-[10.5px] font-extrabold">Hello, Little One</span>
      <span className="absolute bottom-1.5 right-2 text-[8.5px] font-bold">₦10,000</span>
    </span>
  );
}

/**
 * The swipeable offers under the search bar. It moves on to the next card every few seconds,
 * stops for a while when the shopper touches it, and doesn't move at all for anyone who asks
 * for reduced motion.
 */
export function OffersCarousel({ onAction }: { onAction: (action: OfferAction) => void }) {
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
        {MOBILE_OFFERS.map((offer) => {
          const className =
            "relative block h-44 w-[calc(100vw-40px)] max-w-[350px] flex-none snap-start overflow-hidden rounded-[28px] text-left shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]";
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
                  {offer.sub}
                </span>
                <span className="mt-1 inline-flex h-[34px] items-center gap-2 rounded-full bg-shop-ink pl-3.5 pr-[5px] text-[12.5px] font-bold leading-4 text-shop-cream">
                  {offer.cta}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-shop-cream text-shop-ink">
                    <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </span>
              </span>
            </>
          );
          // Going to another page is a link; showing a group on this page is a button.
          return offer.action.kind === "link" ? (
            <Link key={offer.id} to={offer.action.to} data-offer className={className} style={{ background: offer.bg }}>
              {body}
            </Link>
          ) : (
            <button key={offer.id} type="button" data-offer onClick={() => onAction(offer.action)} className={className} style={{ background: offer.bg }}>
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
