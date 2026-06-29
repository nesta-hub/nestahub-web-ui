import { forwardRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface HeaderCartIconProps {
  className?: string;
}

/**
 * In-flow cart icon for page headers (plain — no resting background/border).
 * Unlike FloatingCartIcon (position: fixed), it sits in normal layout flow so
 * it stays aligned with the header padding and does not shift when a scrollbar
 * appears/disappears.
 */
export const HeaderCartIcon = forwardRef<HTMLButtonElement, HeaderCartIconProps>(
  ({ className }, ref) => {
    const { itemCount } = useCart();
    const navigate = useNavigate();

    return (
      <button
        ref={ref}
        onClick={() => navigate("/cart")}
        className={cn(
          "relative w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          "hover:bg-secondary/60 active:scale-95 transition-all",
          className
        )}
        aria-label={`Open cart with ${itemCount} items`}
      >
        <ShoppingCart className="w-5 h-5 text-foreground" />
        {itemCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5",
              "min-w-[18px] h-[18px] px-1 rounded-full",
              "bg-primary text-primary-foreground",
              "text-[10px] font-semibold leading-none",
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
);

HeaderCartIcon.displayName = "HeaderCartIcon";
