import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import nestaLogo from "@/assets/nesta-logo.png";

const MOBILE_MENU_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/mum-tools", label: "Mum Tools" },
  { href: "/share", label: "Share" },
  { href: "/contact", label: "Contact" },
];

/** A menu button that opens the site's links in a panel from the left. */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className={className}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="border-b border-border px-6 pb-4 pt-8">
          <img src={nestaLogo} alt="Nesta Hub" className="h-10" />
        </div>
        <nav aria-label="Menu" className="flex flex-col px-2 py-4">
          {MOBILE_MENU_LINKS.map((link) => {
            // The shop's product pages live under /catalogue, so those count as the shop too.
            const isActive = pathname === link.href || pathname.startsWith(link.href) || (link.href === "/shop" && pathname.startsWith("/catalogue"));
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-4 py-3 text-base font-medium transition-colors",
                  isActive ? "text-nesta-sage" : "text-foreground/80 hover:bg-secondary/40 hover:text-nesta-sage",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
