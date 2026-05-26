import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import nestaLogo from "@/assets/nesta-logo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/share", label: "Share" },
  { href: "/contact", label: "Contact Us" },
];

export function DesktopHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={nestaLogo}
            alt="Nesta Hub"
            className="h-16 object-contain"
          />
        </Link>

        {/* Center Navigation — editorial style */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href ||
              (link.href !== "/" && location.pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors",
                  "after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-px after:bg-nesta-sage after:transition-all after:duration-300",
                  isActive
                    ? "text-nesta-sage after:w-6"
                    : "text-foreground/70 hover:text-nesta-sage after:w-0 hover:after:w-6",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
