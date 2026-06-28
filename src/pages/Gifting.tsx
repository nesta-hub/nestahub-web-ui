import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopGiftingLanding } from "@/components/gifting/desktop/DesktopGiftingLanding";
import cardGiftcard from "@/assets/card-gift.png";
import cardBundles from "@/assets/card-gift-bundles.png";

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
  imageWrap: string;
  imageHover: string;
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
    imageWrap: "absolute right-[-0.5rem] top-[-2rem] w-[11rem] drop-shadow-2xl",
    imageHover: "group-hover:scale-[1.03]",
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
    imageWrap: "absolute right-[-1.0rem] bottom-0 w-[12rem]",
    imageHover: "group-hover:scale-[1.04]",
  },
];

const Gifting = () => {
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
        {/* Page header */}
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
                <h2 className="font-display text-[24px] font-bold text-foreground leading-[1.2] max-w-[62%] tracking-[-0.01em]">
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

              {/* Floating product image */}
              <div className={cn(card.imageWrap, "transition-transform duration-700 ease-out z-0", card.imageHover)}>
                <img
                  src={card.image}
                  alt={card.imageAlt}
                  width={512}
                  height={512}
                  loading="lazy"
                  className="w-full h-auto object-contain"
                />
              </div>
            </button>
          ))}
        </div>

    
      </div>
    </Layout>
  );
};

export default Gifting;
