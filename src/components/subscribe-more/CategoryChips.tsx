import { cn } from "@/lib/utils";

interface Props {
  categories: Array<{ id: string; name: string }>;
  /** The chosen category's id, or null for "All". */
  value: string | null;
  onChange: (id: string | null) => void;
}

function Chip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-10 rounded-[20px] border px-4 text-[14px] font-medium",
        pressed ? "border-[#A08B76] bg-[#A08B76]/10 text-[#A08B76]" : "border-[#E5E0DC] bg-transparent text-shop-ink",
      )}
    >
      {label}
    </button>
  );
}

/** "All" and one pill for each category, wrapping onto a second line when they do not fit. */
export function CategoryChips({ categories, value, onChange }: Props) {
  if (categories.length === 0) return null;
  return (
    <div role="group" aria-label="Categories" className="flex flex-wrap gap-2">
      <Chip label="All" pressed={value === null} onClick={() => onChange(null)} />
      {categories.map((category) => (
        <Chip key={category.id} label={category.name} pressed={value === category.id} onClick={() => onChange(category.id)} />
      ))}
    </div>
  );
}
