import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";
import nestaLogo from "@/assets/nesta-logo.png";

export function MobileScrollHeader({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const [isVisible, setIsVisible] = useState(alwaysVisible);

  useEffect(() => {
    if (alwaysVisible) {
      setIsVisible(true);
      return;
    }
    const onScroll = () => setIsVisible(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysVisible]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border",
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none",
      )}
    >
      <div className="container px-3 h-14 flex items-center justify-between">
        <MobileMenu />

        <Link to="/shop" className="flex items-center">
          <img src={nestaLogo} alt="Nesta Hub" className="h-10" />
        </Link>

        <Button variant="ghost" size="icon" asChild aria-label="Cart">
          <Link to="/cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
