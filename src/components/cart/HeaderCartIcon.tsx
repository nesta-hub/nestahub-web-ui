import { forwardRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

/**
 * In-flow cart icon for page headers. Unlike FloatingCartIcon (position: fixed),
 * this sits in normal layout flow so it stays aligned with the header padding
 * and does not shift when a scrollbar appears/disappears.
 */
export const HeaderCartIcon = forwardRef<HTMLButtonElement>((_, ref) => {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <button
      ref={ref}
      onClick={() => navigate("/cart")}
      className={cn(
        "relative w-10 h-10 rounded-full",
        "bg-background border border-border shadow-sm",
        "flex items-center justify-center shrink-0",
        "transition-transform duration-200 active:scale-95"
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
            "flex items-center justify-center"
          )}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
});

HeaderCartIcon.displayName = "HeaderCartIcon";
