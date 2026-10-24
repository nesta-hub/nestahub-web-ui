import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { CategoryGroup as ApiGroup } from "@/lib/api";
import { GroupMosaic } from "./GroupMosaic";
import { GroupPillRow, type PillItem } from "./GroupPillRow";
import { HeroCarousel } from "./HeroCarousel";
import { TrustStrip } from "./TrustStrip";
import { lookFor } from "./groupLook";
import { scrollBehavior } from "./motion";
import { useGroupScrollSpy } from "./useGroupScrollSpy";
import { cn } from "@/lib/utils";

/**
 * The shop home on desktop: a hero carousel, four reasons to shop, then every group as a
 * mosaic with a sticky row of pills that jumps between them and follows you as you scroll.
 */
export function DesktopShopHome({ groups, loading = false }: { groups: ApiGroup[]; loading?: boolean }) {
  const visible = useMemo(() => groups.filter((g) => g.categories.length > 0), [groups]);
  const sectionIds = useMemo(() => visible.map((g) => `g-${g.slug}`), [visible]);
  const barRef = useRef<HTMLDivElement>(null);
  const { active, stuck } = useGroupScrollSpy(sectionIds, barRef);

  const pills: PillItem[] = useMemo(
    () =>
      visible.map((g) => {
        const look = lookFor(g);
        return { id: g.slug, label: look.label, icon: look.icon };
      }),
    [visible],
  );

  const jump = (slug: string) => document.getElementById(`g-${slug}`)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });

  return (
    <div className="pb-20 text-shop-ink">
      <HeroCarousel />
      <TrustStrip />

      <section id="shop" className="mx-auto max-w-[1680px] scroll-mt-24 px-8 pt-[88px] text-center">
        <h2 className="m-0 text-[42px] font-extrabold leading-[48px] tracking-[-0.03em]">Browse every category</h2>
      </section>

      <div
        ref={barRef}
        className={cn(
          "sticky top-20 z-40 mt-[26px] border-b backdrop-blur-[14px] transition-[background,border-color] duration-[250ms]",
          stuck ? "border-shop-line bg-shop-page/90" : "border-transparent bg-shop-page/0",
        )}
      >
        <div className="mx-auto max-w-[1680px] px-8">
          <GroupPillRow
            items={pills}
            activeId={active ? active.replace(/^g-/, "") : ""}
            onSelect={jump}
            ariaLabel="Jump to a group"
            layout="center"
          />
        </div>
      </div>

      {loading && visible.length === 0 ? (
        <div className="mx-auto max-w-[1680px] px-8 pt-11" role="status" aria-label="Loading categories">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse rounded-3xl bg-shop-surface" />
            ))}
          </div>
        </div>
      ) : (
        visible.map((group, i) => <GroupMosaic key={group.id} group={group} first={i === 0} />)
      )}

      <section aria-label="Need help" className="mx-auto max-w-[1680px] px-8 pt-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[40px] bg-[#E4EADF] px-[52px] py-10">
          <div>
            <h2 className="m-0 text-[30px] font-extrabold leading-9 tracking-[-0.025em]">Can't find it? Message us.</h2>
            <p className="mt-2 text-base leading-[25px] text-[#4A5249]">Tell us what you're looking for and we'll help you find it.</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex h-[54px] items-center gap-3 rounded-full bg-shop-brown pl-7 pr-2 text-[15.5px] font-extrabold text-shop-cream transition-[background] duration-200 hover:bg-shop-brown-dark"
          >
            Contact us
            <span aria-hidden="true" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-shop-cream text-shop-ink">
              <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
