import { useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatGiftPrice, type GiftPackage } from "@/data/giftCatalogue";
import type { PackagingOption } from "@/lib/giftAdapter";

interface PackagingStepProps {
  pkg: GiftPackage;
  /** Live packaging options from usePackagingOptions(). */
  options: PackagingOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PackagingStep({
  pkg,
  options,
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: PackagingStepProps) {
  const selectedIndex = options.findIndex((p) => p.id === selectedId);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isProgrammaticScroll = useRef(false);

  // Programmatic scroll to selected slide when selection changes externally
  useEffect(() => {
    const target = slideRefs.current[selectedIndex];
    if (!target) return;
    isProgrammaticScroll.current = true;
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    const t = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  // Detect centered slide on scroll
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    const id = options[closestIdx]?.id;
    if (id && id !== selectedId) onSelect(id);
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in bg-gradient-to-b from-secondary/40 to-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Choose Packaging
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Swipe to choose your packaging
          </p>
        </div>
      </div>

      {/* Peek carousel */}
      <div className="pt-1">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth py-8"
        >
          {/* Leading spacer */}
          <div className="shrink-0 w-[10%]" aria-hidden />

          {options.map((opt, i) => {
            const isActive = opt.id === selectedId;
            return (
              <div
                key={opt.id}
                ref={(el) => (slideRefs.current[i] = el)}
                className="shrink-0 w-[80%] snap-center px-2"
              >
                <button
                  type="button"
                  onClick={() => onSelect(opt.id)}
                  className={cn(
                    "relative block w-full aspect-[4/5] max-h-[460px] rounded-3xl overflow-hidden text-left select-none transition-all duration-300",
                    "bg-[#F0E8DD] border border-foreground/[0.04]",
                    "shadow-[0_16px_36px_-12px_rgba(28,25,25,0.12),0_4px_12px_-4px_rgba(28,25,25,0.06)]",
                    isActive ? "opacity-100 scale-100" : "opacity-60 scale-[0.96]"
                  )}
                >
                  {/* Selected badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(28,32%,28%)] text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-md">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      Selected
                    </div>
                  )}

                  {/* Soft floor shadow */}
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-[50%] bg-foreground/20 blur-2xl" />

                  <img
                    src={opt.image}
                    alt={opt.name}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain pb-28"
                  />

                  {/* Caption */}
                  <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-8 bg-gradient-to-t from-background/95 via-background/70 to-transparent text-center">
                    <p className="font-display text-lg font-bold text-foreground">
                      {opt.name}
                    </p>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-[18rem] mx-auto">
                        {opt.description}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-foreground/80 mt-1.5">
                      + {formatGiftPrice(opt.price)}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Trailing spacer */}
          <div className="shrink-0 w-[10%]" aria-hidden />
        </div>

        {/* Dot indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {options.map((opt) => {
            const isActive = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                aria-label={`Select ${opt.name}`}
                className={cn(
                  "rounded-full transition-all",
                  isActive
                    ? "w-6 h-2 bg-[hsl(28,32%,36%)]"
                    : "w-2 h-2 bg-foreground/20"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border p-4">
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold rounded-full"
          onClick={onContinue}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
