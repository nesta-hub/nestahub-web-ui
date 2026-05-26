import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import nestaLogo from "@/assets/nesta-logo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/share", label: "Share" },
  { href: "/contact", label: "Contact" },
];

export function MobileScrollHeader({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

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
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="px-6 pt-8 pb-4 border-b border-border">
              <img src={nestaLogo} alt="Nesta Hub" className="h-10" />
            </div>
            <nav className="flex flex-col px-2 py-4">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-base font-medium px-4 py-3 rounded-md transition-colors",
                      isActive
                        ? "text-nesta-sage"
                        : "text-foreground/80 hover:text-nesta-sage hover:bg-secondary/40",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center">
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
