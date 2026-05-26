import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import nestaBoxRect from "@/assets/nesta-box-rect.png";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { giftCardThemes } from "@/components/gifting/GiftCardThemes";
import { cn } from "@/lib/utils";

const Gifting = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!isMobile) {
    return (
      <Layout>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <img src={desktopPlaceholder} alt="Baby care essentials" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">Desktop Experience Coming Soon</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">Browse on a mobile device or a tablet to shop.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Gifting</h1>
          <p className="text-muted-foreground mt-1">Show someone you care</p>
        </div>

        <div className="px-4 space-y-4">
          {/* Gift Cards Card */}
          <button
            onClick={() => navigate("/gifting/cards")}
            className={cn(
              "w-full rounded-2xl overflow-hidden text-left",
              "bg-muted/40 border border-border",
              "transition-all duration-200 active:scale-[0.99]"
            )}
          >
            <div className="p-5 pb-3">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">
                Gift Cards
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                A digital gift card that lets parents shop for baby essentials on their own terms.
              </p>
            </div>
            <div className="px-5 pb-3">
              <div className="w-full max-w-[280px] mx-auto shadow-lg rounded-2xl">
                <GiftCardPreview theme={giftCardThemes[0]} recipientName="Sarah" />
              </div>
            </div>
            <div className="px-5 pb-4 flex items-center gap-1.5 text-primary">
              <span className="text-sm font-semibold">Send a gift card</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Gift Bundles Card */}
          <div
            className={cn(
              "w-full rounded-2xl overflow-hidden text-left",
              "bg-muted/40 border border-border opacity-70"
            )}
          >
            <div className="p-5 pb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">
                  Gift Bundles
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Expertly curated baby care packages, perfect for any stage.
                </p>
              </div>
              <span className="shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-nesta-sage bg-nesta-sage/10 px-2.5 py-1 rounded-full">
                <strong>Coming Soon</strong>
              </span>
            </div>
            <div className="px-5 pb-5">
              <div className="w-full aspect-[16/10] max-w-[280px] mx-auto rounded-2xl bg-gradient-to-br from-[hsl(25,28%,82%)] to-[hsl(30,35%,90%)] flex items-center justify-center shadow-lg overflow-hidden">
                <img src={nestaBoxRect} alt="Nestahub gift box" className="w-full object-contain opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Gifting;
