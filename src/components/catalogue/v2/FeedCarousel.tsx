import { ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { CatalogueProduct } from "@/data/catalogueData";

interface FeedCarouselProps {
  title: string;
  products: CatalogueProduct[];
  onProductClick: (product: CatalogueProduct) => void;
  onSeeAll?: () => void;
}

export function FeedCarousel({ title, products, onProductClick, onSeeAll }: FeedCarouselProps) {
  if (products.length === 0) return null;
  return (
    <section className="pb-1 pl-4">
      <div className="pr-4 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs font-semibold text-primary flex items-center gap-0.5"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-3 pr-4 w-max">
          {products.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-32">
              <ProductCard product={p} onClick={() => onProductClick(p)} size="small" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
