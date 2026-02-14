import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { DesktopHeader } from "./DesktopHeader";
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
  
  // Only show floating cart on shop-related pages (catalogue, shop)
  const isShopPage = location.pathname === "/catalogue" || location.pathname === "/shop";
  const showFloatingCart = isMobile && showNav && isShopPage;

  return (
    <div className="min-h-screen bg-background bg-nesta-pattern">
      {/* Desktop Header */}
      {!isMobile && showNav && <DesktopHeader />}

      {/* Floating Cart Icon for Mobile (except home) */}
      {showFloatingCart && <FloatingCartIcon />}

      {/* Main Content */}
      <main className={`${!isMobile && showNav ? "pt-20" : ""}`}>
        {children}
      </main>

      {/* Footer: always on desktop, only on home for mobile */}
      {(showNav || (isMobile && location.pathname === "/")) && (!isMobile || location.pathname === "/") && (
        <div className={isMobile ? "mb-16" : ""}>
          <Footer />
        </div>
      )}

      {/* Mobile Bottom Nav */}
      {isMobile && showNav && <MobileNav />}
    </div>
  );
}
