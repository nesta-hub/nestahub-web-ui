import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { IconComponent } from "./icons";
import { scrollBehavior } from "./motion";

export interface PillItem {
  id: string;
  label: string;
  icon: IconComponent;
}

interface Props {
  items: PillItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  /** "scroll" is one row that scrolls sideways with faded edges (phone); "center" is a centred row (desktop). */
  layout?: "scroll" | "center";
  /** A touch smaller, for the phone. */
  compact?: boolean;
  className?: string;
}

/** The row of group pills: an icon and a short label each, the active one filled brown. */
export function GroupPillRow({ items, activeId, onSelect, ariaLabel, layout = "scroll", compact = false, className }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setFade({
      left: row.scrollLeft > 6,
      right: row.scrollLeft + row.clientWidth < row.scrollWidth - 6,
    });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, items.length]);

  /** Bring a pill to the middle of the row. */
  const centre = (row: HTMLElement, pill: HTMLElement, behavior: ScrollBehavior) =>
    row.scrollTo?.({ left: Math.max(0, pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2), behavior });

  const pick = (id: string, button: HTMLButtonElement) => {
    const row = rowRef.current;
    if (row && layout === "scroll") centre(row, button, scrollBehavior());
    onSelect(id);
  };

  // Whenever the active pill changes, keep it in view, even when it was not tapped (an advert
  // can pick a group). The first time it simply starts there, without scrolling to it.
  const placed = useRef(false);
  useEffect(() => {
    if (layout !== "scroll") return;
    const row = rowRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !active) return;
    centre(row, active, placed.current ? scrollBehavior() : "auto");
    placed.current = true;
  }, [activeId, layout]);

  return (
    <nav aria-label={ariaLabel} className={cn("relative min-w-0", className)}>
      <div
        ref={rowRef}
        onScroll={measure}
        className={cn(
          "flex gap-1.5 overflow-x-auto scrollbar-hide",
          layout === "center" ? "justify-center gap-2 py-3" : "px-2.5 pb-1.5 pt-2.5",
        )}
      >
        {items.map(({ id, label, icon: Icon }) => {
          const active = id === activeId;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={(e) => pick(id, e.currentTarget)}
              className={cn(
                "flex h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-[20px] border transition-colors",
                compact ? "pl-2.5 pr-3 text-[13px] leading-[18px]" : "pl-3 pr-[15px] text-[13.5px] leading-[18px] gap-[7px]",
                active
                  ? "border-shop-brown bg-shop-brown font-extrabold text-shop-cream"
                  : "border-shop-line bg-white font-semibold text-[#4F4338] hover:border-shop-brown",
              )}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
              {label}
            </button>
          );
        })}
      </div>
      {layout === "scroll" && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-shop-page to-transparent transition-opacity duration-200",
              fade.left ? "opacity-100" : "opacity-0",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-shop-page to-transparent transition-opacity duration-200",
              fade.right ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )}
    </nav>
  );
}
