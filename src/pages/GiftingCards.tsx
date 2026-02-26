import { useState } from "react";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { giftCardThemes, type GiftCardTheme } from "@/components/gifting/GiftCardThemes";

const GiftingCards = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [selectedTheme, setSelectedTheme] = useState<GiftCardTheme>(giftCardThemes[0]);
  const [message, setMessage] = useState("");

  if (!isMobile) {
    return (
      <Layout showNav={false}>
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

  const handleContinue = () => {
    navigate("/gifting/cards/details", {
      state: { theme: selectedTheme, message: message.trim() },
    });
  };

  return (
    <Layout showNav={false}>
      <div className="min-h-screen pb-28">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => navigate("/gifting")} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gift Cards</h1>
            <p className="text-xs text-muted-foreground">Customize your card</p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="px-4 pt-2 pb-4">
          <div className="shadow-lg rounded-2xl">
            <GiftCardPreview theme={selectedTheme} recipientName="" />
          </div>
        </div>

        {/* Theme Circles */}
        <div className="px-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Choose a style</h3>
          <div className="flex gap-3 items-center">
            {giftCardThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={cn(
                  "w-11 h-11 rounded-full bg-gradient-to-br transition-all duration-200 flex-shrink-0",
                  theme.gradient,
                  "saturate-[1.2]",
                  selectedTheme.id === theme.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-105"
                )}
                aria-label={theme.name}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{selectedTheme.name}</p>
        </div>

        {/* Personal Message */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Personal message</h3>
          <div className="relative">
            <Textarea
              placeholder="Write a heartfelt message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 150))}
              maxLength={150}
              className="resize-none min-h-[100px] text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              {message.length}/150
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-30">
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default GiftingCards;
