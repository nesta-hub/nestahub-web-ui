import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Gift, CalendarHeart, MessageCircle, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import { useShoppingForExtras } from "@/hooks/useShoppingForExtras";

interface NavItem {
  href: string;
  /** Other paths that count as being on this item. */
  also?: string[];
  icon: typeof ShoppingBag;
  label: string;
}

// The shop lives at /shop, and its product pages at /catalogue/:slug.
const SHOP: NavItem = { href: "/shop", also: ["/catalogue"], icon: ShoppingBag, label: "Shop" };
const GIFTING: NavItem = { href: "/gifting", icon: Gift, label: "Gifting" };
const CONTACT: NavItem = { href: "/contact", icon: MessageCircle, label: "Contact" };
const ACCOUNT: NavItem = { href: "/account", icon: User, label: "Account" };

/** The nav as it has always been. What every visitor sees while the new Subscribe experience is off. */
const legacyNavItems: NavItem[] = [SHOP, GIFTING, { href: "/mum-tools", icon: CalendarHeart, label: "Mum Tools" }, CONTACT, ACCOUNT];

/** With Subscribe on, it comes right after Shop and Mum Tools is gone. */
const subscribeNavItems: NavItem[] = [SHOP, { href: "/subscriptions", icon: RefreshCw, label: "Subscribe" }, GIFTING, CONTACT, ACCOUNT];

// Helper to generate initials from user name
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const subscribeOn = useSubscribeEnabled();
  const navItems = subscribeOn ? subscribeNavItems : legacyNavItems;
  // While she is adding extra items to an order, the shop is a focused screen with its own bars: no bottom navigation.
  const shoppingForExtras = useShoppingForExtras() !== null;
  if (shoppingForExtras) return null;

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t", subscribeOn ? "border-shop-line bg-shop-cream/95" : "bg-card/95 border-border")}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = [item.href, ...(item.also ?? [])].some(
            (href) => location.pathname === href || location.pathname.startsWith(href + "/"),
          );

          // Special rendering for Account nav item when user is logged in
          const isAccountItem = item.href === "/account";
          const showAvatar = isAccountItem && user;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors",
                // The Subscribe design's own colours: a warm grey, and the brown for where she is.
                subscribeOn
                  ? isActive
                    ? "text-shop-brown"
                    : "text-shop-muted hover:text-shop-ink"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {showAvatar ? (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className={cn(
                    "text-[8px] font-semibold transition-transform",
                    isActive ? "bg-primary text-primary-foreground scale-110" : "bg-secondary text-secondary-foreground"
                  )}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span
                className={cn(
                  subscribeOn ? "text-[10px] leading-[14px] font-semibold" : "text-2xs font-medium",
                  isActive && (subscribeOn ? "font-extrabold" : "font-semibold"),
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
