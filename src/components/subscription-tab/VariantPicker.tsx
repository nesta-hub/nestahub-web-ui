import { apiProductToCatalogue } from "@/lib/catalogueAdapter";
import type { ProductDetail } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isAvailable } from "./variantChoices";

interface Props {
  /** Only the variants she can choose (see `choosableView`). */
  detail: ProductDetail;
  /** What is picked in each group, by attribute name. */
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

/**
 * Choosing a variant the way the product page does: one group of pills for each thing that varies (Type, Size), the
 * picked one marked, and a value that does not go with what else is picked greyed out.
 */
export function VariantPicker({ detail, selected, onChange }: Props) {
  const attributes = apiProductToCatalogue(detail).attributes ?? [];
  return (
    <div>
      {attributes.map((attribute, index) => (
        <div key={attribute.name} className={index === 0 ? "" : "mt-4"}>
          <p className="mb-2 text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-[#6B5F55]">{attribute.name}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={attribute.name}>
            {attribute.values.map((value) => {
              const on = selected[attribute.name] === value.id;
              const available = isAvailable(detail, attribute.name, value.id, selected);
              return (
                <button
                  key={value.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!available}
                  onClick={() => onChange({ ...selected, [attribute.name]: value.id })}
                  className={cn(
                    "h-10 whitespace-nowrap rounded-[20px] border px-4 text-[14px] font-medium transition-all",
                    on ? "border-[#A08B76] bg-[#A08B76]/10 text-[#A08B76]" : "border-[#E5E0DC] text-shop-ink",
                    !available && "pointer-events-none cursor-not-allowed opacity-40",
                  )}
                >
                  {value.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
