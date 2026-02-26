import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
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
          <button
            onClick={() => navigate("/gifting/bundles")}
            className={cn(
              "w-full rounded-2xl overflow-hidden text-left",
              "bg-muted/40 border border-border",
              "transition-all duration-200 active:scale-[0.99]"
            )}
          >
            <div className="p-5 pb-3">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">
                Gift Bundles
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Expertly curated baby care packages, perfect for any stage.
              </p>
            </div>
            <div className="px-5 pb-3">
              <div className="w-full aspect-[16/10] max-w-[280px] mx-auto rounded-2xl bg-gradient-to-br from-[hsl(25,28%,82%)] to-[hsl(30,35%,90%)] flex items-center justify-center shadow-lg">
                <span className="text-6xl opacity-70">🎁</span>
              </div>
            </div>
            <div className="px-5 pb-4 flex items-center gap-1.5 text-primary">
              <span className="text-sm font-semibold">Browse bundles</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Gifting;
