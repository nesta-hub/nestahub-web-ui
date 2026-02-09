import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

export function FloatingCartIcon() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className={cn(
        "fixed top-4 right-4 z-40",
        "w-12 h-12 rounded-full",
        "bg-background border border-border shadow-lg",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:shadow-xl hover:scale-105 active:scale-95"
      )}
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingCart className="w-5 h-5 text-foreground" />
      {itemCount > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "min-w-5 h-5 px-1.5 rounded-full",
            "bg-primary text-primary-foreground",
            "text-xs font-semibold",
            "flex items-center justify-center",
            "animate-in zoom-in-50 duration-200"
          )}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
