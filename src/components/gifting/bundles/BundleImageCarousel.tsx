import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BundleImageCarouselProps {
  images: string[];
  gradient: string;
  alt: string;
  edgeToEdge?: boolean;
}

export function BundleImageCarousel({
  images,
  gradient,
  alt,
  edgeToEdge = false,
}: BundleImageCarouselProps) {
  const [active, setActive] = useState(0);
  const total = images.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isProgrammaticScroll = useRef(false);

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
    if (closestIdx !== active) setActive(closestIdx);
  };

  const scrollToIndex = (i: number) => {
    const target = slideRefs.current[i];
    if (!target) return;
    isProgrammaticScroll.current = true;
    setActive(i);
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 400);
  };

  return (
    <div className="space-y-3">
      {/* Swipeable hero */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={cn(
          "flex w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory bg-gradient-to-br",
          gradient,
          !edgeToEdge && "rounded-2xl"
        )}
      >
        {images.map((img, i) => (
          <div
            key={i}
            ref={(el) => (slideRefs.current[i] = el)}
            className="relative shrink-0 w-full aspect-[4/3] snap-center"
          >
            <img
              src={img}
              alt={`${alt} ${i + 1}`}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dot indicator */}
      {total > 1 && (
        <div
          className={cn(
            "flex items-center justify-center gap-2",
            edgeToEdge && "px-4"
          )}
        >
          {images.map((_, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`View image ${i + 1}`}
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
      )}
    </div>
  );
}
