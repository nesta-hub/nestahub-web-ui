import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Gift, CalendarHeart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  // The shop lives at /shop, and its product pages at /catalogue/:slug.
  { href: "/shop", also: ["/catalogue"], icon: ShoppingBag, label: "Shop" },
  { href: "/gifting", icon: Gift, label: "Gifting" },
  { href: "/mum-tools", icon: CalendarHeart, label: "Mum Tools" },
  { href: "/contact", icon: MessageCircle, label: "Contact" },
  { href: "/account", icon: User, label: "Account" },
];

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
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
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
                  "text-2xs font-medium",
                  isActive && "font-semibold"
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
