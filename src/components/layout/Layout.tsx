import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { DesktopHeader } from "./DesktopHeader";
import { MobileScrollHeader } from "./MobileScrollHeader";
import { Footer } from "./Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { FloatingCartIcon } from "@/components/cart/FloatingCartIcon";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // The shop (v2) renders its own in-header cart, so the floating cart is no
  // longer shown anywhere (it previously only appeared on legacy shop pages).
  const showFloatingCart = false;

  return (
    <div className="min-h-screen bg-background bg-nesta-pattern">
      {/* Desktop Header */}
      {!isMobile && showNav && <DesktopHeader />}

      {/* Mobile header w/ hamburger — only on home & referrals/share */}
      {isMobile && showNav && (location.pathname === "/" || location.pathname === "/referrals" || location.pathname === "/referrals/activity" || location.pathname === "/share" || location.pathname === "/share/activity") && (
        <MobileScrollHeader alwaysVisible={location.pathname === "/referrals" || location.pathname === "/referrals/activity" || location.pathname === "/share" || location.pathname === "/share/activity"} />
      )}

      {/* Floating Cart Icon for Mobile (except home) */}
      {showFloatingCart && <FloatingCartIcon />}

      {/* Main Content */}
      <main className={`${!isMobile && showNav ? "pt-20" : ""}${isMobile && showNav && (location.pathname === "/referrals" || location.pathname === "/referrals/activity" || location.pathname === "/share" || location.pathname === "/share/activity") ? "pt-14" : ""}`}>
        {children}
      </main>

      {/* Footer: always on desktop, only on home for mobile */}
      {(showNav || (isMobile && location.pathname === "/")) && (!isMobile || location.pathname === "/") && (
        <div className={isMobile ? "mb-16" : ""}>
          <Footer />
        </div>
      )}

      {/* Mobile Bottom Nav (hidden on referrals/share) */}
      {isMobile && showNav && location.pathname !== "/referrals" && location.pathname !== "/referrals/activity" && location.pathname !== "/share" && location.pathname !== "/share/activity" && <MobileNav />}
    </div>
  );
}
