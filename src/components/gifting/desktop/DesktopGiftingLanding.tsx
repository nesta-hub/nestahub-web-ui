import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Check, Gift, HeartHandshake, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  giftCategoryMeta,
  formatGiftPrice,
  type GiftCategory,
  type GiftPackage,
} from "@/data/giftCatalogue";
import { useGiftBundles } from "@/hooks/useGifting";
// Lovable used @/assets/gifting/*.asset.json placeholders (Lovable-only, 404).
// Replaced with images already present in this repo's assets.
import cardGiftcard from "@/assets/card-gift.png";
import cardBundles from "@/assets/card-gift-bundles.png";

const WHATSAPP_URL =
  "https://wa.me/2348000000000?text=Hi%20Nesta%20Hub%2C%20I%27d%20love%20some%20help%20choosing%20a%20gift.";

// ───── Sub-hero ─────
function EditorialHero({ onGiftCard, onBundles }: { onGiftCard: () => void; onBundles: () => void }) {
  return (
    <section className="relative bg-[#F5F3F0] overflow-hidden">
      <div className="container py-16 lg:py-20 grid grid-cols-12 gap-8 items-center">
        <div className="col-span-12 lg:col-span-7">
          <span className="block uppercase tracking-[0.24em] text-[11px] font-bold text-[hsl(28,32%,36%)] mb-5">
            The Nesta Hub Gift Edit
          </span>
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-[-0.015em] max-w-[18ch]">
            Gifts, thoughtfully assembled.
          </h1>
          <p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-[52ch] leading-relaxed">
            Hand-packed bundles for new mothers, babies, and the families welcoming them — or a digital
            card if you'd like them to choose.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onBundles}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold bg-[hsl(28,32%,36%)] text-white shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px] transition-transform"
            >
              Shop Bundles <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={onGiftCard}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold border border-foreground/15 text-foreground hover:bg-foreground/[0.04] transition-colors"
            >
              Send a Gift Card
            </button>
          </div>
        </div>
        <div className="hidden lg:block col-span-5 relative">
          <div className="relative aspect-square max-w-[480px] ml-auto">
            <img
              src={cardBundles}
              alt="Curated kraft gift bundle"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(60,40,20,0.25)]"
            />
          </div>
        </div>
      </div>
      <div className="container">
        <div className="h-px bg-[hsl(85,12%,40%)]/15" />
      </div>
    </section>
  );
}

// ───── Ways to gift ─────
function WaysToGift({ onGiftCard, onBundles }: { onGiftCard: () => void; onBundles: () => void }) {
  const tiles = [
    {
      eyebrow: "Digital Gift Card",
      headline: "They choose exactly what they need",
      bullets: ["Delivered instantly via email", "Any amount from ₦10,000", "5 thoughtful themes"],
      cta: "Send Gift Card",
      onClick: onGiftCard,
      image: cardGiftcard,
      bg: "bg-[#FCECE8]",
      eyebrowColor: "text-[#8B5E55]",
    },
    {
      eyebrow: "Curated Gift Sets",
      headline: "Thoughtful care packages, ready to send",
      bullets: ["Hand-assembled in Lagos", "Premium kraft packaging", "Free delivery over ₦50k"],
      cta: "Shop Bundles",
      onClick: onBundles,
      image: cardBundles,
      bg: "bg-[#F0E8DD]",
      eyebrowColor: "text-[#7D6E5D]",
    },
  ];

  return (
    <section className="container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="block uppercase tracking-[0.2em] text-[11px] font-bold text-muted-foreground mb-3">
            Ways to gift
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground tracking-[-0.01em]">
            Pick your kind of thoughtful.
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tiles.map((t) => (
          <button
            key={t.cta}
            onClick={t.onClick}
            className={cn(
              "group relative text-left rounded-[2.5rem] p-10 overflow-hidden min-h-[340px]",
              "shadow-[0_2px_0_hsl(var(--foreground)/0.02),0_30px_60px_-32px_hsl(var(--foreground)/0.3)]",
              "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_70px_-30px_hsl(var(--foreground)/0.35)]",
              t.bg
            )}
          >
            <div className="relative z-10 max-w-[58%]">
              <span className={cn("block uppercase tracking-[0.2em] text-[10px] font-bold mb-4", t.eyebrowColor)}>
                {t.eyebrow}
              </span>
              <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground leading-[1.15] tracking-[-0.01em]">
                {t.headline}
              </h3>
              <ul className="mt-5 space-y-2">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground/75">
                    <Check className="w-4 h-4 text-[hsl(28,32%,45%)] shrink-0" strokeWidth={2.5} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold bg-[hsl(28,32%,36%)] text-white shadow-sm group-hover:gap-3 transition-all">
                {t.cta}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
            </div>
            <div className="absolute -right-6 -bottom-4 w-[55%] max-w-[320px] transition-transform duration-700 ease-out group-hover:rotate-[-2deg] group-hover:scale-[1.04]">
              <img src={t.image} alt="" className="w-full h-auto object-contain drop-shadow-[0_24px_40px_rgba(60,40,20,0.25)]" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ───── Recipient shelf ─────
function RecipientShelf({
  packages,
  onCategory,
}: {
  packages: GiftPackage[];
  onCategory: (c: GiftCategory) => void;
}) {
  const cats: GiftCategory[] = ["baby", "mom", "combo"];
  return (
    <section className="bg-[#F0E8DD]">
      <div className="container py-16 lg:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="block uppercase tracking-[0.2em] text-[11px] font-bold text-[#7D6E5D] mb-3">
              Shop by recipient
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground tracking-[-0.01em]">
              Who is it for?
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cats.map((cat) => {
            const meta = giftCategoryMeta[cat];
            const inCat = packages.filter((p) => p.category === cat);
            const count = inCat.length;
            const image = inCat[0]?.heroImage ?? cardBundles;
            return (
              <button
                key={cat}
                onClick={() => onCategory(cat)}
                className="group relative text-left rounded-3xl overflow-hidden bg-card shadow-[0_2px_0_hsl(var(--foreground)/0.02),0_24px_50px_-30px_hsl(var(--foreground)/0.28)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_hsl(var(--foreground)/0.35)] transition-all duration-500"
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-secondary/40">
                  <img src={image} alt={meta.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <span className="block uppercase tracking-[0.18em] text-[10px] font-bold text-muted-foreground mb-1.5">
                      For {meta.short}
                    </span>
                    <h3 className="font-display text-xl font-bold text-foreground tracking-[-0.01em]">
                      {meta.subtitle}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{count} bundles</p>
                  </div>
                  <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-[hsl(28,32%,36%)] text-white shadow-[0_10px_22px_-10px_hsl(28,32%,28%,0.6)] group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───── Bestselling rail ─────
function BestsellingRail({
  packages,
  onBundle,
}: {
  packages: GiftPackage[];
  onBundle: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const picks = packages.slice(0, 6);

  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (picks.length === 0) return null;

  return (
    <section className="container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <span className="block uppercase tracking-[0.2em] text-[11px] font-bold text-muted-foreground mb-3">
            The Shelf
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground tracking-[-0.01em]">
            Bestselling bundles
          </h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="w-11 h-11 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-foreground/[0.04] transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="w-11 h-11 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-foreground/[0.04] transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2"
      >
        {picks.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => onBundle(pkg.id)}
            className="group snap-start shrink-0 w-[280px] lg:w-[300px] text-left rounded-2xl overflow-hidden bg-card border border-foreground/[0.06] shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_20px_40px_-24px_hsl(28_25%_25%/0.25)] hover:-translate-y-1 hover:shadow-[0_30px_55px_-28px_hsl(28_25%_25%/0.35)] transition-all duration-500"
          >
            <div className="relative aspect-square overflow-hidden bg-secondary/40">
              <img
                src={pkg.heroImage}
                alt={pkg.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
              />
              {pkg.badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-card/95 backdrop-blur text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/80 shadow-sm">
                  {pkg.badge}
                </span>
              )}
            </div>
            <div className="p-4">
              <span className="block uppercase tracking-[0.16em] text-[9px] font-bold text-muted-foreground mb-1">
                {giftCategoryMeta[pkg.category].label}
              </span>
              <h3 className="font-display text-base font-bold text-foreground leading-tight">{pkg.name}</h3>
              {pkg.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{pkg.description}</p>
              )}
              <div className="mt-3 pt-3 border-t border-foreground/[0.06] flex items-end justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-muted-foreground">Starting at</span>
                  <span className="font-display text-[15px] font-bold text-foreground">
                    {formatGiftPrice(pkg.price)}
                  </span>
                </div>
                <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[hsl(28,32%,36%)] text-white shadow-[0_8px_18px_-8px_hsl(28,32%,28%,0.6)] group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ───── Pull quote ─────
function PullQuote() {
  return (
    <section className="bg-[hsl(85,18%,93%)]">
      <div className="container py-20 text-center">
        <Gift className="w-7 h-7 mx-auto text-[hsl(85,18%,35%)] opacity-70 mb-5" strokeWidth={1.5} />
        <p className="font-serif italic text-2xl lg:text-3xl text-foreground/80 leading-[1.4] max-w-[28ch] mx-auto">
          "Every bundle is hand-assembled in Lagos with the same care we'd put into our own family's gifts."
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          — The Nesta Hub Team
        </p>
      </div>
    </section>
  );
}

// ───── Concierge ─────
function ConciergeBand() {
  return (
    <section className="container py-16 lg:py-20">
      <div className="relative rounded-[2.5rem] bg-[#F5F3F0] p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-10 shadow-[0_2px_0_hsl(var(--foreground)/0.02),0_30px_60px_-32px_hsl(var(--foreground)/0.28)] overflow-hidden">
        <div className="shrink-0 w-20 h-20 rounded-full bg-[hsl(28,32%,36%)] text-white flex items-center justify-center shadow-[0_18px_36px_-16px_hsl(28,32%,28%,0.6)]">
          <HeartHandshake className="w-9 h-9" strokeWidth={1.75} />
        </div>
        <div className="flex-1 text-center lg:text-left">
          <span className="block uppercase tracking-[0.2em] text-[11px] font-bold text-[hsl(28,32%,36%)] mb-2">
            Gifting Concierge
          </span>
          <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground leading-tight tracking-[-0.01em]">
            Not sure what to gift? We'll help you choose.
          </h3>
          <p className="mt-2 text-sm lg:text-base text-muted-foreground max-w-[58ch]">
            Tell us about the occasion and the recipient — we'll suggest the perfect bundle, packaging,
            and delivery window over WhatsApp.
          </p>
        </div>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold bg-[hsl(28,32%,36%)] text-white shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px] transition-transform"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2.25} />
          Chat with us
        </a>
      </div>
    </section>
  );
}

// ───── Composer ─────
export function DesktopGiftingLanding() {
  const navigate = useNavigate();
  const { data: packages = [] } = useGiftBundles();
  return (
    <div className="min-h-screen">
      <EditorialHero
        onGiftCard={() => navigate("/gifting/cards")}
        onBundles={() => navigate("/gifting/bundles")}
      />
      <WaysToGift
        onGiftCard={() => navigate("/gifting/cards")}
        onBundles={() => navigate("/gifting/bundles")}
      />
      <RecipientShelf packages={packages} onCategory={(c) => navigate(`/gifting/bundles?cat=${c}`)} />
      <BestsellingRail packages={packages} onBundle={(id) => navigate(`/gifting/bundles/${id}`)} />
      <PullQuote />
      <ConciergeBand />
    </div>
  );
}
