import nestaBoxRect from "@/assets/nesta-box-rect.png";
import { cn } from "@/lib/utils";

export interface GiftBoxItem {
  name: string;
  imageUrl?: string;
}

// Per-gift-category blush/rose/sage backdrop (matches the box colourways)
const BACKDROPS: Record<string, string> = {
  mom: "from-[hsl(350,55%,92%)] to-[hsl(350,45%,85%)]",
  mum: "from-[hsl(350,55%,92%)] to-[hsl(350,45%,85%)]",
  baby: "from-[hsl(205,50%,92%)] to-[hsl(205,40%,84%)]",
  complete: "from-[hsl(95,28%,90%)] to-[hsl(95,22%,82%)]",
  "complete-set": "from-[hsl(95,28%,90%)] to-[hsl(95,22%,82%)]",
};
const DEFAULT_BACKDROP = "from-[hsl(350,55%,92%)] to-[hsl(350,45%,85%)]";

/**
 * Lightweight 2.5D "what's inside" preview — the Nesta box with the contents
 * fanned above it as tilted, overlapping cards. Pure DOM/CSS + <img> (no WebGL),
 * so remote product photos load fine and the bundle stays tiny.
 */
export function GiftBoxComposite({
  items,
  categorySlug,
  className,
}: {
  items: GiftBoxItem[];
  categorySlug?: string;
  className?: string;
}) {
  const backdrop = (categorySlug && BACKDROPS[categorySlug]) || DEFAULT_BACKDROP;
  const shown = items.slice(0, 5);
  const n = shown.length;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-gradient-to-br", backdrop, className)}>
      {/* soft decorative blobs */}
      <div className="absolute -top-8 -left-6 w-28 h-28 rounded-full bg-white/25 blur-xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-black/5 blur-2xl" />

      {/* the gift box, peeking from the bottom */}
      <img
        src={nestaBoxRect}
        alt="Nesta gift box"
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[58%] max-w-[200px] object-contain drop-shadow-xl pointer-events-none select-none"
      />

      {/* contents fanned above the box */}
      <div className="absolute inset-x-0 top-3 flex items-end justify-center">
        {shown.map((it, i) => {
          const offset = i - (n - 1) / 2;
          return (
            <div
              key={i}
              className="relative -mx-2 rounded-xl bg-card shadow-lg ring-1 ring-black/5 overflow-hidden"
              style={{
                width: 56,
                height: 56,
                transform: `rotate(${offset * 7}deg) translateY(${Math.abs(offset) * 6}px)`,
                zIndex: 10 - Math.abs(offset),
              }}
              title={it.name}
            >
              {it.imageUrl ? (
                <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/40 text-sm font-bold text-foreground/70">
                  {it.name.trim().charAt(0).toUpperCase() || "🎁"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* count chip */}
      {n > 0 && (
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-card/85 text-foreground rounded-full px-2 py-0.5 shadow-sm">
          {items.length} {items.length === 1 ? "item" : "items"} inside
        </span>
      )}
    </div>
  );
}

export default GiftBoxComposite;
