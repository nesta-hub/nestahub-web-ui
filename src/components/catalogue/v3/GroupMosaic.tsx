import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Category as ApiCategory, CategoryGroup as ApiGroup } from "@/lib/api";
import { cn } from "@/lib/utils";
import { lookFor, type ResolvedGroupLook } from "./groupLook";
import { TileImage } from "./TileImage";
import { mosaicFor, type Placement } from "./mosaic";

/** The grid's row height: about nine tenths of a column's width, never under 176px. */
const ROW_HEIGHT = "max(176px, calc((min(100vw, 1680px) - 144px) / 6 * 0.9))";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function Tile({ group, category, look, placement }: { group: ApiGroup; category: ApiCategory; look: ResolvedGroupLook; placement?: Placement }) {
  const wide = (placement?.span ?? 1) > 1;
  const style: Vars = {
    background: look.tile.fill,
    boxShadow: `inset 0 0 0 1px ${look.tile.border}`,
    "--b": look.tile.border,
    ...(placement ? { "--col": placement.column, "--span": placement.span, "--row": placement.row } : {}),
  };
  const Icon = look.icon;

  return (
    <Link
      to={`/shop/${group.slug}/${category.slug}`}
      className={cn(
        "group relative block min-w-0 overflow-hidden transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 hover:![box-shadow:inset_0_0_0_1px_var(--b),0_22px_34px_-24px_rgba(51,38,28,0.45)] motion-reduce:transition-none",
        placement && "lg:[grid-column:var(--col)_/_span_var(--span)] lg:[grid-row:var(--row)]",
      )}
      style={style}
    >
      <span
        className={cn(
          "absolute z-[2] font-bold tracking-[-0.005em] text-shop-ink",
          wide
            ? "left-[22px] top-1/2 w-[44%] -translate-y-1/2 text-lg font-extrabold leading-[22px]"
            : "left-4 right-3.5 top-[15px] text-[14.5px] leading-[18px]",
        )}
      >
        {category.displayName}
      </span>
      {category.imageUrl ? (
        <TileImage
          // Start again if the picture changes
          key={category.imageUrl}
          src={category.imageUrl}
          className={wide ? "right-[5%] top-3 h-[calc(100%-24px)] w-[46%]" : "left-[10%] top-[58px] h-[calc(100%-70px)] w-4/5"}
        />
      ) : (
        <span aria-hidden="true" className={cn("absolute flex items-center justify-center text-shop-muted/60", wide ? "right-[5%] top-3 h-[calc(100%-24px)] w-[46%]" : "left-[10%] top-[58px] h-[calc(100%-70px)] w-4/5")}>
          <Icon className="h-10 w-10" strokeWidth={1.3} />
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute bottom-3 right-3 z-[3] flex h-8 w-8 scale-[0.8] items-center justify-center rounded-full bg-white/90 text-shop-ink opacity-0 transition duration-[250ms] group-hover:scale-100 group-hover:opacity-100"
      >
        <ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.9} />
      </span>
    </Link>
  );
}

/**
 * One group on the shop home: a feature panel (its name and photo) on one side, a tile for each
 * category beside it. The tile placement is hand-tuned while the group has the categories it
 * was tuned for; otherwise the tiles simply flow around the panel.
 */
export function GroupMosaic({ group, first = false }: { group: ApiGroup; first?: boolean }) {
  const look = lookFor(group);
  const plan = mosaicFor(group.slug, group.categories.length);
  const side = plan?.side ?? "left";
  const panelRows = plan?.panelRows ?? 2;
  const tall = panelRows >= 3;
  const PanelIcon = look.icon;

  const panelStyle: Vars = {
    background: `radial-gradient(circle at 12% 0%, rgba(255,255,255,0.6), rgba(255,255,255,0) 55%), linear-gradient(160deg, ${look.panel[0]} 0%, ${look.panel[1]} 70%)`,
    "--pcol": side === "left" ? 1 : 5,
    "--prow": panelRows,
  };
  const photoSize = tall ? "clamp(220px,21vw,340px)" : "clamp(190px,16vw,270px)";

  return (
    <section id={`g-${group.slug}`} className={cn("mx-auto max-w-[1680px] scroll-mt-[152px] px-8", first ? "pt-11" : "pt-20")}>
      <div className="grid grid-cols-6 gap-4 max-lg:grid-cols-3" style={{ gridAutoRows: ROW_HEIGHT }}>
        <Link
          to={`/shop/${group.slug}`}
          aria-label={`${look.title}: see everything`}
          className="group relative box-border rounded-[34px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_22px_34px_-24px_rgba(51,38,28,0.45)] max-lg:col-span-full max-lg:min-h-[340px] lg:[grid-column:var(--pcol)_/_span_2] lg:[grid-row:1_/_span_var(--prow)]"
          style={panelStyle}
        >
          <h2 className="absolute left-8 right-8 top-7 m-0 block text-[clamp(34px,3vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            {look.title}
          </h2>
          <span
            className="absolute bottom-[17%] right-6 block overflow-hidden rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.72),0_22px_34px_-20px_rgba(51,38,28,0.45)]"
            style={{ width: photoSize, height: photoSize, background: look.photoBackground ?? "#F8EFE7" }}
          >
            {look.photo ? (
              <img src={look.photo} alt="" className="block h-full w-full object-cover" style={look.photoCrop} />
            ) : (
              <span aria-hidden="true" className="flex h-full w-full items-center justify-center text-shop-muted/50">
                <PanelIcon className="h-1/3 w-1/3" strokeWidth={1.2} />
              </span>
            )}
          </span>
        </Link>
        {group.categories.map((category, i) => (
          <Tile key={category.id} group={group} category={category} look={look} placement={plan?.tiles[i]} />
        ))}
      </div>
    </section>
  );
}
