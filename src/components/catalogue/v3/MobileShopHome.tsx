import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, RotateCcw, Search } from "lucide-react";
import { HeaderCartIcon } from "@/components/cart";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";
import { CategoryTile } from "@/components/catalogue/v2/CategoryTile";
import { apiCategoryToCatalogue } from "@/lib/catalogueAdapter";
import type { Category as ApiCategory, CategoryGroup as ApiGroup } from "@/lib/api";
import { cn } from "@/lib/utils";
import nestaLogo from "@/assets/nesta-logo.png";
import { GroupPillRow, type PillItem } from "./GroupPillRow";
import { OffersCarousel } from "./OffersCarousel";
import { lookFor } from "./groupLook";
import { scrollBehavior } from "./motion";
import type { OfferAction } from "./offers";
import { useGroupScrollSpy } from "./useGroupScrollSpy";

const ALL = "all";
/** How long the old group fades out before the new one fades in. */
const FADE_MS = 170;

interface Props {
  groups: ApiGroup[];
  loading?: boolean;
  /** A group's slug from the address (/shop/:groupSlug): that group's pill starts selected. */
  initialGroupSlug?: string | null;
  hasReorder: boolean;
  onSearch: () => void;
  onReorder: () => void;
  onCategory: (category: ApiCategory) => void;
}

/**
 * The shop on a phone: a title row, an elevated search bar, swipeable offers, a sticky row
 * of group pills, and the categories of one group at a time (or every group under "All").
 */
export function MobileShopHome({ groups, loading = false, initialGroupSlug, hasReorder, onSearch, onReorder, onCategory }: Props) {
  const visible = useMemo(() => groups.filter((g) => g.categories.length > 0), [groups]);
  const routeId = initialGroupSlug && visible.some((g) => g.slug === initialGroupSlug) ? initialGroupSlug : ALL;

  // What the shopper picked, which overrides the address until the address itself changes.
  const [picked, setPicked] = useState<string | null>(null);
  const [shownPicked, setShownPicked] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [seenRoute, setSeenRoute] = useState(routeId);
  if (seenRoute !== routeId) {
    setSeenRoute(routeId);
    setPicked(null);
    setShownPicked(null);
  }
  const active = picked ?? routeId;
  /** What is on screen. It trails `active` by the fade, so the old group leaves before the new one arrives. */
  const shown = shownPicked ?? routeId;

  const anchorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { stuck } = useGroupScrollSpy([], barRef, { stuckAt: 0.5 });

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pick = (id: string) => {
    if (id === active) return;
    setPicked(id);
    setFading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Coming from further down the page, bring the pills back to the top first.
      const anchor = anchorRef.current;
      if (anchor) {
        const top = anchor.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY > top) window.scrollTo({ top });
      }
      setShownPicked(id);
      setFading(false);
    }, FADE_MS);
  };

  /** Bring the pills to the top of the screen, so the categories under them are in view. */
  const scrollToCategories = () => {
    const anchor = anchorRef.current;
    if (anchor) window.scrollTo({ top: anchor.getBoundingClientRect().top + window.scrollY, behavior: scrollBehavior() });
  };

  /** An offer that shows part of this page: every group, or one group (all of them if it no longer exists). */
  const onOffer = (action: OfferAction) => {
    if (action.kind === "link") return;
    pick(action.kind === "group" && visible.some((g) => g.slug === action.slug) ? action.slug : ALL);
    scrollToCategories();
  };

  const pills: PillItem[] = useMemo(
    () => [
      { id: ALL, label: "All", icon: LayoutGrid },
      ...visible.map((g) => {
        const look = lookFor(g);
        return { id: g.slug, label: look.label, icon: look.icon };
      }),
    ],
    [visible],
  );

  const sections = shown === ALL ? visible : visible.filter((g) => g.slug === shown);

  return (
    <div className="min-h-screen pb-24 text-shop-ink">
      {/* Top row: the menu and the logo on the left, the wallet in the middle, the cart on the right */}
      <div className="relative flex items-center justify-between px-2.5 pb-1 pt-3">
        <h1 className="sr-only">Shop</h1>
        <div className="flex items-center">
          <MobileMenu />
          <Link to="/shop" aria-label="Nesta Hub" className="-ml-1 flex items-center">
            <img src={nestaLogo} alt="" className="h-10 w-auto" />
          </Link>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 top-3 flex items-center justify-center">
          <span className="pointer-events-auto">
            <WalletBalancePill variant="outlined" size="sm" />
          </span>
        </div>
        <HeaderCartIcon />
      </div>

      {/* Search */}
      <div className="flex gap-2.5 px-5 pb-[18px] pt-1.5">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search baby products and brands"
          className="flex h-[52px] min-w-0 flex-1 items-center gap-[11px] rounded-full bg-white px-[18px] text-left shadow-[0_12px_28px_-12px_rgba(51,38,28,0.32),0_2px_8px_rgba(51,38,28,0.06)]"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <span className="truncate text-[14.5px] text-shop-muted">Search baby products, brands</span>
        </button>
        {hasReorder && (
          <button
            type="button"
            onClick={onReorder}
            aria-label="Buy again"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white text-shop-brown shadow-[0_12px_28px_-12px_rgba(51,38,28,0.32),0_2px_8px_rgba(51,38,28,0.06)]"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>

      <OffersCarousel onAction={onOffer} />

      {/* Group pills, sticky; the cart joins them once they stick to the top */}
      <div ref={anchorRef} aria-hidden="true" className="h-0" />
      <div
        ref={barRef}
        className={cn(
          "sticky top-0 z-20 mt-1.5 flex bg-shop-page/95 backdrop-blur-[14px] transition-shadow duration-200",
          stuck ? "shadow-[0_10px_16px_-14px_rgba(51,38,28,0.4)]" : "shadow-none",
        )}
      >
        <GroupPillRow items={pills} activeId={active} onSelect={pick} ariaLabel="Shop groups" compact className="flex-1" />
        {/* The same vertical padding as the pill row, so the cart sits level with the pills */}
        <div
          className={cn(
            "flex flex-none items-center justify-center overflow-hidden pb-1.5 pt-2.5 transition-[flex-basis] duration-200",
            stuck ? "basis-[52px]" : "basis-0",
          )}
          aria-hidden={!stuck}
          data-testid="stuck-cart"
        >
          <HeaderCartIcon />
        </div>
      </div>

      {/* The categories */}
      {loading && visible.length === 0 ? (
        <div className="grid grid-cols-4 gap-x-3 gap-y-[18px] px-4 pt-4" role="status" aria-label="Loading categories">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-[#EFEAE4]" />
          ))}
        </div>
      ) : (
        <div className={cn("transition-[opacity,transform] duration-200", fading && "translate-y-1.5 opacity-0")}>
          {sections.map((group, i) => (
            <section key={group.id} aria-label={lookFor(group).title} className={cn("px-4", i === 0 ? "pt-4" : "pt-[26px]")}>
              {/* The same size whether every group is showing or just this one */}
              <h2 className="mb-3.5 text-[19px] font-extrabold leading-7 tracking-[-0.015em]">{lookFor(group).title}</h2>
              <div className="grid grid-cols-4 gap-x-3 gap-y-[18px]">
                {group.categories.map((c) => (
                  <CategoryTile key={c.id} variant="flat" category={apiCategoryToCatalogue(c, group.id)} onClick={() => onCategory(c)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mx-5 mb-7 mt-[30px] text-center text-[13px] leading-[18px] text-shop-muted">
        Can't find it?{" "}
        <Link to="/contact" className="font-bold text-shop-brown underline underline-offset-[3px]">
          Message us
        </Link>
      </p>
    </div>
  );
}
