import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatGiftPrice,
  type GiftPackage,
} from "@/data/giftCatalogue";
import { type PackagingOption } from "@/lib/giftAdapter";
import { BundleIncludedList } from "@/components/gifting/bundles/BundleIncludedList";

interface DesktopGiftBundleDetailProps {
  pkg: GiftPackage;
  packagingOptions: PackagingOption[];
  bundleId: string;
}

export function DesktopGiftBundleDetail({ pkg, packagingOptions, bundleId }: DesktopGiftBundleDetailProps) {
  const navigate = useNavigate();
  const [packagingId, setPackagingId] = useState<string>(packagingOptions[0]?.id ?? "");
  const [activeImage, setActiveImage] = useState(0);

  const selectedPackaging = packagingOptions.find((p) => p.id === packagingId) ?? packagingOptions[0];
  const total = pkg.price + (selectedPackaging?.price ?? 0);

  const handleProceed = () => {
    const params = new URLSearchParams({ source: "gift-bundle", bundleId });
    if (packagingId) params.set("packagingId", packagingId);
    navigate(`/checkout?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav strip */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={() => navigate("/gifting/bundles")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Gift Bundles
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground truncate">{pkg.name}</span>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-12 gap-10">
          {/* Left: images + details */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-secondary/40 group">
                <img
                  src={pkg.galleryImages[activeImage] ?? pkg.heroImage}
                  alt={pkg.name}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                />
                {pkg.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-card/95 backdrop-blur text-xs font-bold uppercase tracking-[0.12em] text-foreground/90 shadow-sm">
                    {pkg.badge}
                  </span>
                )}
                {pkg.galleryImages.length > 1 && activeImage > 0 && (
                  <button
                    onClick={() => setActiveImage((i) => i - 1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-card transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                )}
                {pkg.galleryImages.length > 1 && activeImage < pkg.galleryImages.length - 1 && (
                  <button
                    onClick={() => setActiveImage((i) => i + 1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-card transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                )}
              </div>
              {pkg.galleryImages.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {pkg.galleryImages.map((_, i) => {
                    const isActive = i === activeImage;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        aria-label={`Image ${i + 1}`}
                        className={cn(
                          "rounded-full transition-all",
                          isActive
                            ? "w-6 h-2 bg-[hsl(28,32%,36%)]"
                            : "w-2 h-2 bg-foreground/20 hover:bg-foreground/40"
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Name & description */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="font-display text-3xl font-bold text-foreground leading-tight tracking-[-0.02em]">
                    {pkg.name}
                  </h1>
                  <p className="text-muted-foreground mt-2 max-w-[52ch] leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
                <span className="shrink-0 mt-1 px-2.5 py-1 rounded-full bg-secondary/70 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">
                  {pkg.items.length} items
                </span>
              </div>
            </div>

            {/* What's included */}
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                What's Included
              </h2>
              <BundleIncludedList items={pkg.items} />
            </div>
          </div>

          {/* Right: packaging + sticky CTA */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">
                  Starting at
                </p>
                <p className="font-display text-4xl font-bold text-foreground tracking-[-0.02em]">
                  {formatGiftPrice(pkg.price)}
                </p>
              </div>

              {/* Packaging selector */}
              {packagingOptions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Choose packaging
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {packagingOptions.map((opt) => {
                      const active = opt.id === packagingId;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPackagingId(opt.id)}
                          className={cn(
                            "relative block w-full rounded-2xl overflow-hidden text-left select-none transition-all duration-300",
                            "bg-[#F0E8DD] border",
                            "shadow-[0_10px_24px_-12px_rgba(28,25,25,0.18),0_3px_8px_-3px_rgba(28,25,25,0.06)]",
                            active
                              ? "border-[hsl(28,32%,36%)] opacity-100 scale-100"
                              : "border-foreground/[0.06] opacity-70 scale-[0.98] hover:opacity-90"
                          )}
                        >
                          {active && (
                            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(28,32%,28%)] text-[9px] font-bold uppercase tracking-[0.1em] text-white shadow-md">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              Selected
                            </div>
                          )}
                          <div className="relative aspect-square">
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-4 rounded-[50%] bg-foreground/15 blur-xl" />
                            <img
                              src={opt.image}
                              alt={opt.name}
                              draggable={false}
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          </div>
                          <div className="px-4 pb-4 pt-2 text-center bg-gradient-to-t from-background/95 via-background/80 to-transparent">
                            <p className="font-display text-sm font-bold text-foreground">{opt.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                              {opt.description}
                            </p>
                            <p className="text-[11px] font-semibold text-foreground/80 mt-1.5">
                              + {formatGiftPrice(opt.price)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order summary */}
              <Card className="p-4 bg-card border border-foreground/[0.06]">
                <h3 className="font-semibold text-sm text-foreground mb-3">Order summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2 text-muted-foreground">
                    <span>{pkg.name}</span>
                    <span className="font-medium text-foreground">{formatGiftPrice(pkg.price)}</span>
                  </div>
                  {selectedPackaging && (
                    <div className="flex justify-between gap-2 text-muted-foreground">
                      <span>{selectedPackaging.name}</span>
                      <span className="font-medium text-foreground">+ {formatGiftPrice(selectedPackaging.price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 pt-3 border-t border-border font-bold text-foreground">
                    <span>Total</span>
                    <span className="font-display text-lg">{formatGiftPrice(total)}</span>
                  </div>
                </div>
              </Card>

              <Button
                variant="shop"
                className="w-full h-12 text-base font-semibold"
                onClick={handleProceed}
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Free gift message included · Nationwide delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
