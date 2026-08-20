import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, ShoppingBag } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceCategoryAccordion } from "@/components/prices/PriceCategoryAccordion";
import { usePriceList } from "@/hooks/usePriceList";
import {
  buildCategoryBlocks,
  filterCategoryBlocks,
  formatUpdatedLabel,
} from "@/lib/priceListRows";
import { usePriceListSeo } from "@/hooks/usePriceListSeo";

const Prices = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = usePriceList();

  const allCategories = useMemo(() => buildCategoryBlocks(data), [data]);
  const categories = useMemo(
    () => filterCategoryBlocks(allCategories, query),
    [allCategories, query],
  );

  const searching = query.trim().length > 0;
  const openValues = searching ? categories.map((c) => c.id) : open;
  const allOpen = !searching && open.length > 0 && open.length === categories.length;
  const updated = formatUpdatedLabel(data?.updatedAt);

  usePriceListSeo(allCategories, data?.variantCount ?? 0);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="mx-auto max-w-4xl px-4 pb-32 pt-10 sm:pt-14">
        <header className="mb-8">
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            Nesta Hub
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Price List
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data ? `Updated ${updated}.` : "All products and prices at a glance."}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center print:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands or variants"
                className="h-11 rounded-full bg-card pl-9"
                disabled={isLoading || isError}
              />
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-full sm:w-auto"
              onClick={() => setOpen(allOpen ? [] : categories.map((c) => c.id))}
              disabled={searching || isLoading || isError || categories.length === 0}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              We couldn’t load the price list just now.
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {searching
              ? `No products match “${query}”.`
              : "No products are listed yet."}
          </p>
        ) : (
          <Accordion
            type="multiple"
            value={openValues}
            onValueChange={(v) => !searching && setOpen(v)}
            className="space-y-3"
          >
            {categories.map((c) => (
              <PriceCategoryAccordion
                key={c.id}
                id={c.id}
                name={c.name}
                rows={c.rows}
              />
            ))}
          </Accordion>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in Naira (₦) and may change without notice. Availability varies —
          confirm stock when you order.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Ready to order?
          </p>
          <div className="flex flex-1 gap-2 sm:flex-none">
            <Button
              asChild
              variant="outline"
              className="flex-1 gap-2 rounded-full sm:flex-none"
            >
              <a
                href="https://wa.me/2347081940881"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                Order via WhatsApp
              </a>
            </Button>
            <Button asChild className="flex-1 gap-2 rounded-full sm:flex-none">
              <Link to="/catalogue">
                <ShoppingBag className="h-4 w-4" />
                Order via web
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prices;
