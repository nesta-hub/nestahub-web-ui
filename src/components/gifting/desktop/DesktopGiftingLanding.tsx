import { useNavigate } from "react-router-dom";
import { ArrowRight, Gift, PenLine, Truck, Sparkles, MessageCircleHeart, Wallet, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import giftingHero from "@/assets/gifting-hero.webp";
import cardGiftcard from "@/assets/gifting-card-giftcard.webp";
import cardBundles from "@/assets/gifting-card-bundles.webp";

const BROWN = "hsl(28,32%,36%)";

export function DesktopGiftingLanding() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F7F3EE] min-h-screen">
      {/* Hero */}
      <section className="container pt-4 lg:pt-6 pb-8">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-6 relative z-10">
            <h1 className="font-display text-[64px] leading-[1.02] font-bold text-foreground tracking-[-0.02em]">
              Supporting <span style={{ color: BROWN }}>new parents</span>,{" "}
              <span className="italic font-normal font-serif">simplified</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-[44ch] leading-relaxed">
              New parents deserve <strong>all the care and support</strong> they can get. But between busy schedules and
              the guesswork of gifting, it's easy to let the moment pass. Nesta Hub helps you deliver{" "}
              <strong>meaningful gifts in minutes</strong>.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-6 relative z-0">
            <img
              src={giftingHero}
              alt="Nesta Hub gift card and curated bundle box"
              className="w-[125%] max-w-none h-auto object-contain drop-shadow-[0_30px_50px_rgba(120,80,40,0.15)] lg:-ml-28 transform transition-transform hover:scale-[1.02] duration-500"
            />
          </div>
        </div>
      </section>

      {/* Two CTA cards */}
      <section className="container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CtaCard
            eyebrow="Digital Gift Card"
            headline={
              <>
                Let them choose exactly
                <br />
                what they need.
              </>
            }
            sub="Skip the guesswork. Moms choose what they really need"
            metaPills={["Any amount", "Instant delivery", "Include personal note"]}
            chip="Instant"
            cta="Send Gift Card"
            image={cardGiftcard}
            imageAlt="Nesta Hub digital gift card"
            surfaceClass="bg-[radial-gradient(at_top_left,#FFF6EE,#FAEDE6_55%,#F4DFD0)]"
            patternClass="[background-image:radial-gradient(hsl(28,32%,36%)_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.05]"
            blobColor="bg-[#F4C9AE]"
            onClick={() => navigate("/gifting/cards")}
          />
          <CtaCard
            eyebrow="Curated Gift Sets"
            headline={
              <>
                Thoughtful
                <br />
                curated care
                <br />
                packages.
              </>
            }
            sub="Well thought-out curated items for both mum and baby"
            metaPills={["From ₦10,000", "Hand-packed", "Nationwide delivery"]}
            chip="Signature"
            cta="Shop Bundles"
            image={cardBundles}
            imageAlt="Curated Nesta Hub bundle"
            surfaceClass="bg-[radial-gradient(at_top_left,#FAF1DF,#F0E5D6_55%,#E6D6BD)]"
            patternClass="[background-image:repeating-linear-gradient(45deg,hsl(28,32%,36%)_0_1px,transparent_1px_10px)] opacity-[0.05]"
            blobColor="bg-[#E2C99A]"
            onClick={() => navigate("/gifting/bundles")}
          />
        </div>
      </section>

      {/* Promise band */}
      <section className="container mt-16 pb-20">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="h-px flex-1 max-w-[120px] bg-[hsl(28,20%,75%)]/60" />
          <span className="uppercase tracking-[0.3em] text-[11px] font-bold" style={{ color: BROWN }}>
            Why Nesta Hub Gifting
          </span>
          <span className="h-px flex-1 max-w-[120px] bg-[hsl(28,20%,75%)]/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Feature
            number="01"
            icon={<Gift className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Robust Baby & Mum Catalog"
            sub="Gift cards give access to our robust baby and mums shopping catalog."
          />
          <Feature
            number="02"
            icon={<PenLine className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Stellar Packaging"
            sub="Gift sets are beautifully packaged in premium Nesta Hub materials."
          />
          <Feature
            number="03"
            icon={<Truck className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Delivered with care"
            sub="Fast, reliable delivery you can trust."
          />
          <Feature
            number="04"
            icon={<MessageCircleHeart className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Personal Notes"
            sub="Add a heartfelt note that prints on the gift card or packing slip."
          />
          <Feature
            number="05"
            icon={<Wallet className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Flexible Amounts"
            sub="Choose any value from ₦10,000 upward — no awkward fixed tiers."
          />
          <Feature
            number="06"
            icon={<ScanLine className="w-6 h-6" strokeWidth={1.75} style={{ color: BROWN }} />}
            title="Easy Redemption"
            sub="Recipients redeem in seconds with a single code, no account hoops."
          />
        </div>
      </section>
    </div>
  );
}

function CtaCard({
  eyebrow,
  headline,
  sub,
  metaPills,
  chip,
  cta,
  image,
  imageAlt,
  surfaceClass,
  patternClass,
  blobColor,
  onClick,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  sub: React.ReactNode;
  metaPills: string[];
  chip: string;
  cta: string;
  image: string;
  imageAlt: string;
  surfaceClass: string;
  patternClass: string;
  blobColor: string;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-[2.25rem] p-10 overflow-hidden transition-all duration-300",
        "ring-1 ring-[hsl(28,25%,82%)]/60",
        "shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_30px_60px_-30px_rgba(120,80,40,0.25)]",
        "hover:-translate-y-1.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_40px_70px_-30px_rgba(120,80,40,0.35)]",
        surfaceClass,
      )}
    >
      {/* Decorative blob */}
      <div
        className={cn(
          "absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40 pointer-events-none",
          blobColor,
        )}
      />
      {/* Pattern overlay */}
      <div className={cn("absolute inset-0 pointer-events-none", patternClass)} />

      <div className="relative grid grid-cols-[auto_1fr] gap-7 items-start">
        {/* Medallion */}
        <div className="relative shrink-0">
          <div className="w-[220px] h-[220px] rounded-full bg-white/60 backdrop-blur-sm p-2 ring-1 ring-white/70 shadow-[0_10px_30px_-15px_rgba(120,80,40,0.3)]">
            <div className="w-full h-full rounded-full bg-[#E8DDD0]/70 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(120,80,40,0.08)]">
              <img
                src={image}
                alt={imageAlt}
                className="w-[185px] h-[185px] object-contain transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-[3deg]"
              />
            </div>
          </div>
          {/* Floating chip */}
          <div
            className="absolute -top-1 -right-2 inline-flex items-center gap-1 bg-white rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_20px_-8px_rgba(120,80,40,0.35)] ring-1 ring-[hsl(28,25%,82%)]/60"
            style={{ color: BROWN }}
          >
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            {chip}
          </div>
        </div>

        <div className="pt-2">
          <span
            className="flex items-center gap-1.5 uppercase tracking-[0.24em] text-[11px] font-bold mb-3"
            style={{ color: BROWN }}
          >
            <span aria-hidden>✦</span>
            {eyebrow}
          </span>
          <h2 className="font-display text-[34px] lg:text-[36px] leading-[1.08] font-bold text-foreground tracking-[-0.01em] text-balance">
            {headline}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{sub}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {metaPills.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full bg-white/50 ring-1 ring-[hsl(28,25%,82%)]/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {pill}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={onClick}
              className="inline-flex items-center gap-2 rounded-full pl-7 pr-2 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px] hover:brightness-90 transition-all"
              style={{ backgroundColor: BROWN }}
            >
              {cta}
              <span className="bg-white/15 rounded-full p-1.5 ml-1 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  number,
  icon,
  title,
  sub,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="group bg-white/70 backdrop-blur-sm rounded-[1.75rem] p-7 ring-1 ring-[hsl(28,20%,85%)]/70 shadow-[0_20px_40px_-30px_rgba(120,80,40,0.25)] hover:-translate-y-1 hover:ring-[hsl(28,32%,36%)]/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAEDE6] to-[#EFE0CE] ring-1 ring-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {icon}
        </div>
        <div className="flex-1">
          <span className="block uppercase tracking-[0.3em] text-[10px] font-bold mb-1.5" style={{ color: BROWN }}>
            {number}
          </span>
          <h3 className="font-display text-[18px] font-semibold text-foreground leading-tight">{title}</h3>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-[1.55]">{sub}</p>
        </div>
      </div>
    </div>
  );
}
