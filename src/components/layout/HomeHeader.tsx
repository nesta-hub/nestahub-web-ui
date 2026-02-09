import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import nestaLogo from "@/assets/nesta-logo.png";

export function HomeHeader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border",
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none",
      )}
    >
      <div className="container px-4 h-14 flex items-center justify-between">
        {/* Empty spacer for layout balance */}
        <div className="w-16" />

        {/* Centered Logo */}
        <Link to="/" className="flex items-center">
          <img src={nestaLogo} alt="Nesta Hub" className="h-9" />
        </Link>

        {/* Shop Button */}
        <Button asChild size="sm" className="px-4">
          <Link to="/catalogue">Shop</Link>
        </Button>
      </div>
    </header>
  );
}
