import { Link } from "react-router-dom";
import { Star, Shield, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import heroLifestyle from "@/assets/hero-lifestyle-new.png";
import cardBundles from "@/assets/card-gift-bundles.png";
import cardEverything from "@/assets/card-everything.png";
import cardSubscribe from "@/assets/card-subscribe.png";

interface EntryCardProps {
  to: string;
  image: string;
  title: string;
  description: string;
  className?: string;
}

function EntryCard({ to, image, title, description, className }: EntryCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out min-h-[260px] md:min-h-[320px]",
        "md:hover:-translate-y-1 md:hover:shadow-xl md:active:translate-y-0 md:active:shadow-lg",
        "md:card-image-zoom",
        className,
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 card-image-overlay" />
      </div>

      {/* Content at bottom */}
      <div className="relative z-10 mt-auto p-5 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: "#3c4136" }}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>

        {/* Hover indicator */}
        <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Explore</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

interface TrustBadgeProps {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}

function TrustBadge({ icon, iconClass, title, description }: TrustBadgeProps) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-md", iconClass)}>
        {icon}
      </div>
      <h4 className="font-semibold text-foreground text-center mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
}

export function ShopEntry() {
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Full-Bleed Hero Section with border on mobile */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center justify-center border-b border-border md:border-b-0">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <img src={heroLifestyle} alt="Premium baby care products" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-image-overlay" />
        </div>

        {/* Centered content */}
        <div className="relative z-10 container px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style={{ color: "#3c4136" }}>
              <span className="block">Welcome to</span>
              <span className="block">Nesta Hub</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-lg mx-auto">
              Curated baby care, delivered on your schedule
            </p>

            {/* Desktop: Shop Bundles link */}
            <Button asChild size="lg" className="hidden md:inline-flex px-10 py-6 text-lg">
              <Link to="/catalogue">Shop Bundles</Link>
            </Button>

            {/* Mobile: Shop button navigates to /catalogue */}
            <Button asChild size="lg" className="md:hidden px-10 py-6 text-lg">
              <Link to="/catalogue">Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Entry Cards */}
      <div className="flex-1 px-4 py-10 md:py-14">
        <div className="w-full max-w-6xl mx-auto grid gap-5 md:grid-cols-3">
          {/* Curated Bundles - Featured */}
          <EntryCard
            to="/catalogue"
            image={cardEverything}
            title="Everything You Need"
            description="A wide selection of quality products carefully sourced."
          />

          {/* Curated Gift Bundles */}
          <EntryCard
            to="/gifting"
            image={cardBundles}
            title="Expertly Curated Gift Bundles"
            description="Thoughtfully researched bundles, ready to gift."
          />

          {/* Subscribe */}
          <EntryCard
            to="/subscribe"
            image={cardSubscribe}
            title="Care, Made Continuous"
            description="Auto-renewals of orders so care never runs out."
          />
        </div>
      </div>

      {/* Enhanced Trust Badges */}
      <div className="px-4 pb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-8">Why Nesta Hub?</h2>
        <div className="w-full max-w-4xl mx-auto grid gap-4 md:grid-cols-3">
          <TrustBadge
            icon={<Star className="w-6 h-6 text-white" strokeWidth={1.5} />}
            iconClass="trust-icon-gold"
            title="Expert Curated"
            description="Researched by parents, for parents"
          />
          <TrustBadge
            icon={<Shield className="w-6 h-6 text-white" strokeWidth={1.5} />}
            iconClass="trust-icon-sage"
            title="Premium Brands"
            description="Only the best for your little one"
          />
          <TrustBadge
            icon={<Tag className="w-6 h-6 text-white" strokeWidth={1.5} />}
            iconClass="trust-icon-coral"
            title="Low Prices"
            description="Premium care at honest prices"
          />
        </div>
      </div>
    </div>
  );
}
