import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrollBehavior } from "./motion";
import { HERO_SLIDES, REFERRAL_REWARDS, type HeroSlide } from "./offers";
import { useAutoAdvance } from "./useAutoAdvance";
import nestaLogo from "@/assets/nesta-logo.png";
import heroBaby from "@/assets/shop/offers/hero-baby.webp";
import ringStack from "@/assets/shop/offers/ring-stack.webp";
import babyWipes from "@/assets/shop/offers/baby-wipes.webp";
import alphabetSet from "@/assets/shop/offers/alphabet-set.webp";
import toteBag from "@/assets/shop/offers/tote-bag.webp";
import tumbler from "@/assets/shop/offers/tumbler.webp";

const CUTOUT = "drop-shadow-[0_12px_14px_rgba(51,38,28,0.28)]";
const CTA_CLASS =
  "inline-flex h-[54px] items-center gap-3 rounded-full bg-shop-brown pl-7 pr-2 text-[15.5px] font-extrabold text-shop-cream transition-[background] duration-200 hover:bg-shop-brown-dark";

/** A product chip floating over the first slide's photo. */
function ProductChip({ image, name, price, className, imageClass }: { image: string; name: string; price: string; className: string; imageClass: string }) {
  return (
    <div className={cn("absolute flex items-center gap-3 rounded-[22px] bg-white py-2.5 pl-3 pr-[18px] shadow-[0_20px_34px_-18px_rgba(51,38,28,0.4)]", className)}>
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#F1ECE4]">
        <img src={image} alt="" className={imageClass} />
      </span>
      <span>
        <span className="block text-[13.5px] font-extrabold leading-[17px]">{name}</span>
        <span className="block text-[12.5px] font-bold leading-4 text-shop-brown">{price}</span>
      </span>
    </div>
  );
}

const GIFT_CARDS = [
  { name: "Welcome to the World", bg: "linear-gradient(135deg, #FCECE8, #F6D9CE, #FCECE8)", ink: "#5C3A30", x: 0, y: 18, rot: -8 },
  { name: "Our Little Sunshine", bg: "linear-gradient(135deg, #F0E8DD, #E6D6BE, #F0E8DD)", ink: "#5C4A2E", x: 130, y: 132, rot: 5 },
  { name: "Hello, Little One", bg: "linear-gradient(135deg, #E8EEF5, #CFDCEB, #E8EEF5)", ink: "#324461", x: 8, y: 246, rot: -4 },
];

const ART: Record<HeroSlide["id"], () => ReactNode> = {
  shop: () => (
    <>
      <img
        src={heroBaby}
        alt="A smiling baby surrounded by wipes, lotions, a feeding bottle, folded clothes, shoes and a soft bunny"
        className="block h-full w-full rotate-2 rounded-[44px] object-cover shadow-[0_36px_60px_-34px_rgba(51,38,28,0.5)]"
      />
      <ProductChip image={ringStack} name="Rainbow Ring Stack" price="from ₦6,000" className="-left-10 top-16" imageClass="block h-11 w-auto" />
      <ProductChip image={babyWipes} name="Dr Brown's Baby wipes" price="from ₦1,300" className="-right-[26px] bottom-[54px]" imageClass="block h-auto w-11" />
    </>
  ),
  toys: () => (
    <>
      <span aria-hidden="true" className="absolute left-[30px] top-[30px] h-[380px] w-[380px] rounded-full bg-[#F7F2E9] shadow-[0_26px_44px_-28px_rgba(51,38,28,0.45),inset_0_0_0_1px_rgba(255,255,255,0.7)]" />
      <img src={alphabetSet} alt="" aria-hidden="true" className={cn("absolute right-[192px] top-[92px] z-[1] h-[274px] w-auto -rotate-6", CUTOUT)} />
      <img src={ringStack} alt="" aria-hidden="true" className={cn("absolute right-[62px] top-12 z-[2] h-[335px] w-auto rotate-[5deg]", CUTOUT)} />
    </>
  ),
  gift: () => (
    <>
      {GIFT_CARDS.map((card) => (
        <span
          key={card.name}
          aria-hidden="true"
          className="absolute h-[182px] w-[290px] overflow-hidden rounded-[22px] shadow-[0_26px_40px_-20px_rgba(51,38,28,0.5)]"
          style={{ left: card.x, top: card.y, transform: `rotate(${card.rot}deg)`, background: card.bg }}
        >
          <img src={nestaLogo} alt="" className="absolute left-3 top-[5px] h-[50px] w-auto opacity-90" />
          <span className="absolute right-4 top-4 text-[10.5px] font-bold leading-[13px] tracking-[0.14em] opacity-50" style={{ color: card.ink }}>
            GIFT CARD
          </span>
          <span className="absolute inset-x-0 top-[74px] px-4 text-center text-[20px] font-extrabold leading-6 opacity-90" style={{ color: card.ink }}>
            {card.name}
          </span>
          <span className="absolute bottom-[13px] right-4 text-[15px] font-bold leading-[18px] opacity-80" style={{ color: card.ink }}>
            ₦10,000
          </span>
        </span>
      ))}
    </>
  ),
  share: () => (
    <>
      <span aria-hidden="true" className="absolute left-[30px] right-2.5 top-[392px] h-[30px] rounded-full bg-[rgba(51,38,28,0.22)] blur-[14px]" />
      <img
        src={tumbler}
        alt=""
        aria-hidden="true"
        className="absolute right-3 top-10 z-[1] h-[340px] w-[340px] rotate-3 rounded-[40px] object-cover shadow-[0_30px_50px_-28px_rgba(51,38,28,0.5)]"
      />
      <img src={toteBag} alt="" aria-hidden="true" className={cn("absolute right-[236px] top-[120px] z-[2] h-[290px] w-auto -rotate-[5deg]", CUTOUT)} />
      <div className="absolute -left-[18px] top-[34px] z-[3] whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-[13px] font-extrabold leading-[17px] shadow-[0_18px_30px_-18px_rgba(51,38,28,0.4)]">
        Tote bag <span className="text-shop-brown">· {REFERRAL_REWARDS.tote} referrals</span>
      </div>
      <div className="absolute -right-3 bottom-2.5 z-[3] whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-[13px] font-extrabold leading-[17px] shadow-[0_18px_30px_-18px_rgba(51,38,28,0.4)]">
        Tumbler <span className="text-shop-brown">· {REFERRAL_REWARDS.tumbler} referrals</span>
      </div>
    </>
  ),
};

function Cta({ slide }: { slide: HeroSlide }) {
  const arrow = (
    <span aria-hidden="true" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-shop-cream text-shop-ink">
      <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
    </span>
  );
  if (slide.action.kind === "link") {
    return (
      <Link to={slide.action.to} className={CTA_CLASS}>
        {slide.cta}
        {arrow}
      </Link>
    );
  }
  const target = slide.action.target;
  // Scrolls to that part of the page; if it is not there (a group that no longer exists), to the categories.
  const scroll = () =>
    (document.getElementById(target) ?? document.getElementById("shop"))?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  return (
    <button type="button" className={CTA_CLASS} onClick={scroll}>
      {slide.cta}
      {arrow}
    </button>
  );
}

/** How long to leave the slides alone after the shopper changes slide themselves. */
const HOLD_AFTER_TAP_MS = 12_000;

/**
 * The desktop shop's hero: four slides that cross-fade, moving on every six seconds unless the
 * pointer is over them or the shopper just moved them, never for reduced motion.
 */
export function HeroCarousel() {
  const [slide, setSlide] = useState(0);
  const { pauseFor, setHeld } = useAutoAdvance(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000);

  const goTo = (i: number) => {
    setSlide((i + HERO_SLIDES.length) % HERO_SLIDES.length);
    pauseFor(HOLD_AFTER_TAP_MS);
  };

  return (
    <section
      id="home"
      aria-roledescription="carousel"
      aria-label="Offers"
      className="mx-auto max-w-[1680px] px-8 pt-7"
    >
      <div
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        className="relative grid overflow-hidden rounded-[44px] bg-[#ECE3D6]"
      >
        {HERO_SLIDES.map((s, i) => {
          const on = i === slide;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${HERO_SLIDES.length}`}
              aria-hidden={!on}
              data-slide={s.id}
              className="relative col-start-1 row-start-1 grid min-h-[580px] grid-cols-[1.05fr_0.95fr] items-center gap-6 pb-[88px] pl-14 pr-12 pt-[52px] max-lg:grid-cols-1 max-lg:px-8 max-lg:pb-24 max-lg:pt-11"
              style={{
                background: s.bg,
                opacity: on ? 1 : 0,
                visibility: on ? "visible" : "hidden",
                transition: `opacity 0.8s ease, visibility 0s linear ${on ? "0s" : "0.8s"}`,
              }}
            >
              <span aria-hidden="true" className="absolute -right-[130px] -top-[150px] h-[560px] w-[560px] rounded-full" style={{ background: s.circleBig }} />
              <span aria-hidden="true" className="absolute -bottom-[140px] -left-[110px] h-[340px] w-[340px] rounded-full" style={{ background: s.circleSmall }} />
              <div
                className="relative max-w-[560px] transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                style={{ transform: `translateY(${on ? 0 : 14}px)` }}
              >
                <h1 className="m-0 text-[62px] font-extrabold leading-[66px] tracking-[-0.035em]">{s.title}</h1>
                <p className="mt-[22px] max-w-[480px] text-lg leading-7 text-[#5A4E44]">{s.lead}</p>
                <div className="mt-[34px] flex flex-wrap items-center gap-3.5">
                  {on ? <Cta slide={s} /> : <span className="h-[54px]" aria-hidden="true" />}
                </div>
              </div>
              <div className="relative aspect-square w-full max-w-[440px] justify-self-end max-lg:justify-self-center">{ART[s.id]()}</div>
            </div>
          );
        })}

        <div className="absolute bottom-[50px] left-14 z-[5] flex items-center gap-2">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === slide ? "true" : undefined}
              className="h-2 rounded border-0 p-0 transition-[width,background] duration-[350ms]"
              style={{ width: i === slide ? 30 : 8, background: i === slide ? "#795A3E" : "rgba(51,38,28,0.28)" }}
            />
          ))}
        </div>
        <div className="absolute bottom-[42px] right-12 z-[5] flex items-center gap-2.5">
          {[
            { label: "Previous slide", icon: ArrowLeft, to: slide - 1 },
            { label: "Next slide", icon: ArrowRight, to: slide + 1 },
          ].map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(to)}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-shop-ink transition duration-200 hover:scale-[1.06] hover:bg-white"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
