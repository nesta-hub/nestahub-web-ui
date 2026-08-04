import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PriceRow, type PriceVariantRow } from "./PriceRow";

interface PriceCategoryAccordionProps {
  id: string;
  name: string;
  rows: PriceVariantRow[];
}

export function PriceCategoryAccordion({
  id,
  name,
  rows,
}: PriceCategoryAccordionProps) {
  return (
    <AccordionItem
      value={id}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <AccordionTrigger className="px-4 py-3.5 text-left text-sm font-semibold text-foreground hover:no-underline">
        <span className="flex flex-1 items-center justify-between gap-3 pr-3">
          {name}
          <span className="text-xs font-normal tabular-nums text-muted-foreground">
            {rows.length}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <div className="hidden items-center gap-3 border-t border-border bg-muted/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:flex">
          <span className="w-10 flex-shrink-0" />
          <span className="min-w-0 flex-1">Product</span>
          <span className="w-56 flex-shrink-0">Variant</span>
          <span className="w-28 flex-shrink-0 text-right">Price</span>
        </div>
        <div className="divide-y divide-border/60 border-t border-border">
          {rows.map((row, i) => (
            <PriceRow key={row.key} row={row} index={i} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
