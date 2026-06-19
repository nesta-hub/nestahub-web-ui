import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
// Lovable used @/assets/gifting/*.asset.json placeholders (Lovable-only, 404).
// Replaced with the gift card images already present in this repo's assets.
import cardGiftcard from "@/assets/card-gift.png";
import cardBundles from "@/assets/card-gift-bundles.png";
import { DesktopGiftingLanding } from "@/components/gifting/desktop/DesktopGiftingLanding";

type CardDef = {
  eyebrow: string;
  headline: string;
  cta: string;
  to: string;
  image: string;
  imageAlt: string;
  cardBg: string;
  eyebrowColor: string;
  ctaBg: string;
  ctaText: string;
  /** Card tint used to blend the inner edge of the image column. */
  fade: string;
};

const cards: CardDef[] = [
  {
    eyebrow: "Digital Gift Card",
    headline: "They choose exactly what they need",
    cta: "Send Gift Card",
    to: "/gifting/cards",
    image: cardGiftcard,
    imageAlt: "Nesta Hub digital gift card",
    cardBg: "bg-[#FCECE8]",
    eyebrowColor: "text-[#8B5E55]",
    ctaBg: "bg-[hsl(28,32%,36%)]",
    ctaText: "text-white",
    fade: "#FCECE8",
  },
  {
    eyebrow: "Curated Gift Sets",
    headline: "Thoughtful curated care packages",
    cta: "Shop Bundles",
    to: "/gifting/bundles",
    image: cardBundles,
    imageAlt: "Curated kraft gift bundle box",
    cardBg: "bg-[#F0E8DD]",
    eyebrowColor: "text-[#7D6E5D]",
    ctaBg: "bg-[hsl(28,32%,36%)]",
    ctaText: "text-white",
    fade: "#F0E8DD",
  },
  // Build-your-own (3D builder) parked — intentionally hidden.
];

const GiftingV2 = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!isMobile) {
    return (
      <Layout>
        <DesktopGiftingLanding />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Page header standard style */}
        <div className="px-5 pt-6 pb-2">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight tracking-[-0.01em]">Gifting</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Show someone you care</p>
        </div>

        {/* Card stack */}
        <div className="px-5 pt-6 space-y-6">
          {cards.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={cn(
                "group relative w-full text-left rounded-[2.5rem] p-7 overflow-hidden",
                "min-h-[260px] flex flex-col justify-between",
                "shadow-[0_2px_0_hsl(var(--foreground)/0.02),0_24px_50px_-30px_hsl(var(--foreground)/0.28)]",
                "transition-all duration-300 active:scale-[0.99]",
                card.cardBg,
              )}
            >
              {/* Text */}
              <div className="relative z-10">
                <span className={cn("block uppercase tracking-[0.2em] text-[10px] font-bold mb-4", card.eyebrowColor)}>
                  {card.eyebrow}
                </span>
                <h2 className="font-display text-[24px] font-bold text-foreground leading-[1.2] max-w-[56%] tracking-[-0.01em]">
                  {card.headline}
                </h2>
              </div>

              {/* CTA */}
              <div className="relative z-10 mt-6">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold shadow-sm",
                    card.ctaBg,
                    card.ctaText,
                  )}
                >
                  {card.cta}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </div>

              {/* Full-height product image column. The assets are framed photos
                  (not transparent cut-outs), so a full-bleed column reads as
                  intentional where a floating corner image looked unfinished. */}
              <div className="absolute inset-y-0 right-0 w-[42%] z-0 overflow-hidden rounded-r-[2.5rem]">
                <img
                  src={card.image}
                  alt={card.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {/* Soft blend into the card tint on the inner edge */}
                <div
                  className="absolute inset-y-0 left-0 w-16"
                  style={{ backgroundImage: `linear-gradient(to right, ${card.fade}, transparent)` }}
                  aria-hidden
                />
              </div>
            </button>
          ))}
        </div>

        {/* Sentiment */}
        <div className="text-center pt-8 pb-2">
          <p className="font-serif italic text-foreground/40 text-lg">
            Made with love <span className="not-italic ml-1 text-sm opacity-70">✧</span>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default GiftingV2;
