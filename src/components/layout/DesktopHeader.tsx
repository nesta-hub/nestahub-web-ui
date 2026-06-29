import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeaderCartIcon } from "@/components/cart/HeaderCartIcon";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import nestaLogo from "@/assets/nesta-logo.png";

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/share", label: "Share" },
  { href: "/contact", label: "Contact Us" },
];

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center h-20">
        {/* Logo — fixed width left zone */}
        <div className="w-[200px] flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src={nestaLogo}
              alt="Nesta Hub"
              className="h-16 object-contain"
            />
          </Link>
        </div>

        {/* Center Navigation — truly centered via flex-1 */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-10">
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

        {/* Right Actions — same fixed width as logo zone, contents pushed right */}
        <div className="w-[200px] flex items-center justify-end gap-2">
          {location.pathname.startsWith("/catalogue") && <WalletBalancePill size="sm" iconOnly />}
          <HeaderCartIcon />
          <Link to="/account" className="rounded-full">
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <span><User className="h-5 w-5" /></span>
              </Button>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
