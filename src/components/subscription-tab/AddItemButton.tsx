import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

/** The dashed "+ Subscribe to something else" button: first in her list of items, and under the invitation on an empty tab. */
export function AddItemButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <Link
      to="/subscriptions/add"
      className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[26px] border-[1.5px] border-dashed border-[#CFC6BC] bg-transparent text-[14px] font-extrabold text-shop-brown no-underline ${className}`}
    >
      <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      {label}
    </Link>
  );
}
