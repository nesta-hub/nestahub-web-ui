import { Link, useLocation, useSearchParams } from "react-router-dom";
import { RotateCcw, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeaderCartIcon } from "@/components/cart/HeaderCartIcon";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRecentVariants } from "@/hooks/useCatalogue";
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
  { href: "/shop", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/share", label: "Share" },
  { href: "/contact", label: "Contact Us" },
];

/** Where the shop itself lives: its home and its listings, not a product page. */
const isShopRoute = (pathname: string) => pathname === "/shop" || pathname.startsWith("/shop/") || pathname === "/catalogue";

/**
 * The shop's search box, in the header. What is typed lives in the address (`?q=`), so the
 * shop page shows the results and the back button and links keep working. Buy again, for
 * someone who has something to buy again, opens the shop's panel the same way (`?reorder=1`).
 */
function ShopSearch() {
  const [params, setParams] = useSearchParams();
  const { session } = useAuth();
  const { data: recent } = useRecentVariants(session?.access_token);
  const hasReorder = (recent?.variants.length ?? 0) > 0;
  const query = params.get("q") ?? "";

  const change = (edit: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    edit(next);
    setParams(next, { replace: true });
  };

  return (
    <div className="hidden h-[46px] w-[260px] items-center gap-2.5 rounded-full bg-white pl-[18px] pr-2 shadow-[0_12px_26px_-14px_rgba(51,38,28,0.32),0_2px_6px_rgba(51,38,28,0.06)] md:flex xl:w-[340px]">
      <Search className="h-[17px] w-[17px] shrink-0 text-shop-ink" strokeWidth={1.8} aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => change((next) => (e.target.value ? next.set("q", e.target.value) : next.delete("q")))}
        placeholder="Search baby products, brands"
        aria-label="Search baby products and brands"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-shop-ink outline-none placeholder:text-shop-muted"
      />
      {query ? (
        <button
          type="button"
          onClick={() => change((next) => next.delete("q"))}
          aria-label="Clear search"
          className="flex h-8 w-8 items-center justify-center rounded-full text-shop-muted hover:text-shop-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : hasReorder ? (
        <button
          type="button"
          onClick={() => change((next) => next.set("reorder", "1"))}
          aria-label="Buy again"
          title="Buy again"
          className="flex h-8 w-8 items-center justify-center rounded-full text-shop-brown hover:bg-shop-page"
        >
          <RotateCcw className="h-[17px] w-[17px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const onShop = isShopRoute(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className={cn("container flex items-center h-20", onShop && "max-w-[1680px] px-8")}>
        {/* Logo — fixed width left zone */}
        <div className="w-[200px] flex items-center">
          <Link to="/shop" className="flex items-center">
            <img
              src={nestaLogo}
              alt="Nesta Hub"
              className="h-16 object-contain"
            />
          </Link>
        </div>

        {/* Center Navigation — truly centered via flex-1 */}
        <nav className={cn("hidden md:flex flex-1 items-center justify-center", onShop ? "gap-6 xl:gap-10" : "gap-10")}>
          {navLinks.map((link) => {
            // The shop's product pages live under /catalogue, so those count as the shop too.
            const isActive =
              link.href === "/shop"
                ? isShopRoute(location.pathname) || location.pathname.startsWith("/catalogue")
                : location.pathname === link.href || location.pathname.startsWith(link.href);

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
        <div className={cn("flex items-center justify-end gap-2", onShop ? "shrink-0 gap-2.5" : "w-[200px]")}>
          {onShop ? (
            <>
              <ShopSearch />
              <WalletBalancePill variant="outlined" className="hidden xl:inline-flex" />
            </>
          ) : (
            location.pathname.startsWith("/catalogue") && <WalletBalancePill size="sm" iconOnly />
          )}
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
