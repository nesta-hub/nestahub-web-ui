import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "./ProductCard";
import { useProductSearch } from "@/hooks/useCatalogue";
import { apiCardToCatalogue } from "@/lib/catalogueAdapter";
import type { ProductCard as ApiProductCard } from "@/lib/api";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onProductClick: (productKey: string, raw: ApiProductCard) => void;
}

export function SearchOverlay({ open, onClose, onProductClick }: SearchOverlayProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const trimmed = query.trim();
  const { data, isFetching } = useProductSearch(trimmed, open);
  const rawResults = useMemo(() => data?.products ?? [], [data]);
  const results = useMemo(() => rawResults.map(apiCardToCatalogue), [rawResults]);
  const rawById = useMemo(() => {
    const m: Record<string, ApiProductCard> = {};
    for (const p of rawResults) m[p.id] = p;
    return m;
  }, [rawResults]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-top duration-200">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-border">
        <button
          onClick={onClose}
          aria-label="Close search"
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search baby essentials, brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 text-base h-11"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!trimmed ? (
          <p className="text-sm text-muted-foreground text-center pt-12">
            Search baby essentials, brands, categories…
          </p>
        ) : isFetching && results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-12">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-12">
            No products found for "{trimmed}"
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  size="large"
                  onClick={() => {
                    onProductClick(product.id, rawById[product.id]);
                    onClose();
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
