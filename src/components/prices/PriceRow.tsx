import { formatPrice } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface PriceVariantRow {
  key: string;
  image?: string;
  title: string;
  variant: string;
  /** Kobo — formatPrice converts to Naira. */
  price: number;
  compareAtPrice?: number;
}

interface PriceRowProps {
  row: PriceVariantRow;
  index: number;
}

export function PriceRow({ row, index }: PriceRowProps) {
  const discounted =
    row.compareAtPrice !== undefined && row.compareAtPrice > row.price;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 sm:px-4",
        index % 2 === 1 && "bg-muted/40",
      )}
    >
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-secondary/50">
        {row.image ? (
          <img
            src={row.image}
            alt={row.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
        {row.variant && (
          <p className="truncate text-xs text-muted-foreground sm:hidden">
            {row.variant}
          </p>
        )}
      </div>

      <p className="hidden w-56 flex-shrink-0 truncate text-xs text-muted-foreground sm:block">
        {row.variant}
      </p>

      <div className="w-28 flex-shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatPrice(row.price)}
        </p>
        {discounted && (
          <p className="text-xs tabular-nums text-muted-foreground line-through">
            {formatPrice(row.compareAtPrice!)}
          </p>
        )}
      </div>
    </div>
  );
}
