import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileOffer } from "./offers";
import nestaLogo from "@/assets/nesta-logo.png";
import alphabetSet from "@/assets/shop/offers/alphabet-set.webp";
import ringStack from "@/assets/shop/offers/ring-stack.webp";
import heroBaby from "@/assets/shop/offers/hero-baby.webp";
import moobiLogo from "@/assets/shop/offers/moobi-logo.png";
import toteBag from "@/assets/shop/offers/tote-bag.webp";
import tumblerCutout from "@/assets/shop/offers/tumbler-cutout.png";

const SHADOW = "drop-shadow-[0_6px_8px_rgba(51,38,28,0.28)]";

/** The picture on the right-hand side of each phone offer card. */
export function OfferArt({ id }: { id: MobileOffer["id"] }) {
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
  if (id === "moobi") {
    // The logo is lime on white, so it sits on a white card, tilted like the gift card.
    return (
      <span
        aria-hidden="true"
        className="absolute -right-1 top-[46px] flex h-[88px] w-[142px] -rotate-[4deg] items-center justify-center rounded-[20px] bg-white shadow-[0_14px_24px_-14px_rgba(51,38,28,0.5)] ring-1 ring-[rgba(51,38,28,0.06)]"
      >
        <img src={moobiLogo} alt="" className="w-[112px]" />
      </span>
    );
  }
  if (id === "community-delivery") {
    // A seal, like a stamp on a parcel: dark, with a dashed inner ring, so the price stands out.
    return (
      <span
        aria-hidden="true"
        className="absolute right-4 top-8 flex h-[116px] w-[116px] rotate-[7deg] flex-col items-center justify-center rounded-full bg-shop-ink text-shop-cream shadow-[0_14px_22px_-12px_rgba(51,38,28,0.65)]"
      >
        <span className="absolute inset-[5px] rounded-full border-[1.5px] border-dashed border-shop-cream/45" />
        <span className="relative text-[9px] font-extrabold leading-3 tracking-[0.2em] text-shop-cream/80">ONLY</span>
        <span className="relative text-[30px] font-extrabold leading-8 tracking-[-0.03em]">₦500</span>
        <Truck className="relative mt-0.5 h-[18px] w-[18px] text-shop-cream/90" strokeWidth={1.8} />
      </span>
    );
  }
  if (id === "referrals") {
    // As designed: the bag and the cup are cut-outs standing on a soft shadow, not pictures in rounded tiles.
    return (
      <>
        <span aria-hidden="true" className="absolute right-5 top-[142px] h-3.5 w-[130px] rounded-full bg-[rgba(51,38,28,0.18)] blur-[7px]" />
        <img src={toteBag} alt="" className={cn("absolute right-[84px] top-[50px] z-[1] h-24 -rotate-[5deg]", SHADOW)} />
        <img src={tumblerCutout} alt="" className={cn("absolute right-[30px] top-8 z-[2] h-[116px] rotate-[3deg]", SHADOW)} />
      </>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2 top-[46px] h-[85px] w-[136px] -rotate-[5deg] scale-[0.86] overflow-hidden rounded-[14px] text-[#324461] shadow-[0_12px_22px_-12px_rgba(51,38,28,0.5)]"
      style={{ background: "linear-gradient(135deg,#E8EEF5,#CFDCEB,#E8EEF5)" }}
    >
      <img src={nestaLogo} alt="" className="absolute left-1.5 top-[3px] h-[26px] w-auto opacity-90" />
      {/* On the right, level with the logo */}
      <span className="absolute right-[9px] top-2 text-[6.5px] font-bold leading-[8px] tracking-[0.14em] opacity-50">GIFT CARD</span>
      <span className="absolute inset-x-0 top-9 px-2.5 text-center text-[10.5px] font-extrabold leading-[13px] opacity-90">Hello, Little One</span>
      <span className="absolute bottom-[7px] right-[9px] text-[8.5px] font-bold leading-[10px] opacity-80">₦10,000</span>
    </span>
  );
}
