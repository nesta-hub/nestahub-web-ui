import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { CategoryGroup as ApiGroup } from "@/lib/api";
import { useCategoryProducts } from "@/hooks/useCatalogue";
import { cn } from "@/lib/utils";
import { ListingCard } from "./ListingCard";
import { lookFor } from "./groupLook";
import { SORTS, sortProducts, type Sort } from "./listingHelpers";

interface Props {
  groups: ApiGroup[];
  loading: boolean;
  groupSlug: string;
  categorySlug?: string;
  onProduct: (key: string) => void;
}

/**
 * A group, or one category in it, as a page: a banner in the group's colours, chips to move
 * between its categories, a sort, and the products. Give it a `key` of its address so the sort
 * starts again for each page.
 */
export function DesktopListing({ groups, loading, groupSlug, categorySlug, onProduct }: Props) {
  const group = groups.find((g) => g.slug === groupSlug);
  const category = categorySlug ? group?.categories.find((c) => c.slug === categorySlug) : undefined;
  const missing = !loading && (!group || (!!categorySlug && !category));

  const { data, isLoading: productsLoading } = useCategoryProducts({
    category: category?.slug,
    group: category ? undefined : group?.slug,
    enabled: !!group && !missing,
  });
  const [sort, setSort] = useState<Sort>("featured");
  const products = useMemo(() => sortProducts(data?.products ?? [], sort), [data, sort]);

  if (missing) {
    return (
      <div className="mx-auto max-w-[1680px] px-8 py-24 text-center text-shop-ink">
        <h1 className="m-0 text-[34px] font-extrabold leading-10 tracking-[-0.02em]">We couldn't find that</h1>
        <p className="mt-2 text-shop-muted">It may have moved. Browse everything we stock instead.</p>
        <Link to="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-shop-brown px-7 font-extrabold text-shop-cream hover:bg-shop-brown-dark">
          Back to the shop
        </Link>
      </div>
    );
  }

  const look = group ? lookFor(group) : null;
  const title = category?.displayName ?? look?.title ?? "";
  const blurb = category?.description?.trim() || (category ? `Part of ${look?.title}.` : `Everything we stock in ${look?.title ?? "this group"}.`);
  const count = data?.products.length ?? 0;
  const Icon = look?.icon;

  return (
    <div className="mx-auto max-w-[1680px] px-8 pb-20 pt-7 text-shop-ink">
      <section
        aria-label={title}
        className="flex items-center justify-between gap-8 rounded-[34px] px-11 py-9 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] max-lg:flex-col-reverse max-lg:items-start"
        style={{ background: look ? `linear-gradient(160deg, ${look.panel[0]} 0%, ${look.panel[1]} 70%)` : undefined }}
      >
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(34px,3.6vw,54px)] font-extrabold leading-[1.06] tracking-[-0.03em]">{title || " "}</h1>
          <p className="mt-3 max-w-[560px] text-base leading-[25px] text-[#4F443B]">{blurb}</p>
          {!productsLoading && (
            <span className="mt-[18px] inline-block rounded-full bg-white/70 px-3.5 py-[7px] text-[13px] font-bold leading-[18px]">
              {count === 1 ? "1 product" : `${count} products`}
            </span>
          )}
        </div>
        <span
          className="block h-[150px] w-[150px] flex-none overflow-hidden rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.72),0_22px_34px_-20px_rgba(51,38,28,0.45)]"
          style={{ background: look?.photoBackground ?? "#F8EFE7" }}
        >
          {look?.photo ? (
            <img src={look.photo} alt="" className="block h-full w-full object-cover" style={look.photoCrop} />
          ) : Icon ? (
            <span aria-hidden="true" className="flex h-full w-full items-center justify-center text-shop-muted/50">
              <Icon className="h-12 w-12" strokeWidth={1.2} />
            </span>
          ) : null}
        </span>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Categories" className="flex min-w-0 flex-1 gap-2 overflow-x-auto pr-8 scrollbar-hide [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]">
          {group &&
            [{ slug: undefined, label: "All" }, ...group.categories.map((c) => ({ slug: c.slug, label: c.displayName }))].map((chip) => {
              const active = chip.slug === categorySlug;
              return (
                <Link
                  key={chip.slug ?? "all"}
                  to={chip.slug ? `/shop/${group.slug}/${chip.slug}` : `/shop/${group.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 flex-none items-center whitespace-nowrap rounded-[20px] border px-4 text-[13.5px] leading-[18px] transition-colors",
                    active ? "border-shop-brown bg-shop-brown font-extrabold text-shop-cream" : "border-shop-line bg-white font-semibold text-[#4F4338] hover:border-shop-brown",
                  )}
                >
                  {chip.label}
                </Link>
              );
            })}
        </nav>
        <label className="flex flex-none items-center gap-2.5 text-[13.5px] text-shop-muted">
          Sort by
          <span className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 appearance-none rounded-[20px] border border-shop-line bg-white pl-4 pr-10 text-[13.5px] font-semibold text-shop-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
          </span>
        </label>
      </div>

      {productsLoading ? (
        <div className="mt-[26px] grid grid-cols-5 gap-5 max-xl:grid-cols-4 max-lg:grid-cols-3" role="status" aria-label="Loading products">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[22px] bg-shop-surface" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-16 text-center text-shop-muted">Nothing here yet. Try another category.</p>
      ) : (
        <div className="mt-[26px] grid grid-cols-5 gap-5 max-xl:grid-cols-4 max-lg:grid-cols-3">
          {products.map((product) => (
            <ListingCard key={product.id} product={product} onOpen={() => onProduct(product.slug ?? product.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
