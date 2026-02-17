import { Link } from "react-router-dom";
import { Heart, Truck, Award, Users, Instagram, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroLifestyle from "@/assets/hero-lifestyle-new.png";
import cardBundles from "@/assets/card-gift-bundles.png";
import cardEverything from "@/assets/card-everything.png";
import cardSubscribe from "@/assets/card-subscribe.png";
import instaGrid1 from "@/assets/insta-grid-1.jpg";
import instaGrid2 from "@/assets/insta-grid-2.jpg";
import instaGrid3 from "@/assets/insta-grid-3.jpg";
import instaGrid4 from "@/assets/insta-grid-4.jpg";
import instaGrid5 from "@/assets/insta-grid-5.jpg";
import instaGrid6 from "@/assets/insta-grid-6.jpg";
import valueCurated from "@/assets/value-curated.jpg";
import valueSafety from "@/assets/value-safety.jpg";
import valueDelivery from "@/assets/value-delivery.jpg";

interface EntryCardProps {
  to: string;
  image: string;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
  entranceClass?: string;
  canEnter?: boolean;
  onFullyVisible?: () => void;
}

function EntryCard({ to, image, title, description, className, style, entranceClass, canEnter, onFullyVisible }: EntryCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const isMobile = useIsMobile();
  const [entranceDone, setEntranceDone] = useState(false);

  // Notify parent when this card is 100% visible (mobile only)
  useEffect(() => {
    if (!isMobile || !onFullyVisible) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onFullyVisible();
          observer.disconnect();
        }
      },
      { threshold: 1.0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, onFullyVisible]);

  const needsEntrance = isMobile && entranceClass;
  const showEntrance = needsEntrance && canEnter;

  return (
    <Link
      ref={cardRef}
      to={to}
      style={style}
      onAnimationEnd={(e) => {
        if (e.animationName === "slide-in-from-right" || e.animationName === "slide-in-from-left") {
          setEntranceDone(true);
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden",
        "min-h-[260px] md:min-h-[320px]",
        "shadow-lg",
        "md:transition-all md:duration-500 md:ease-out md:hover:rotate-0 md:hover:translate-y-0 md:hover:shadow-2xl md:hover:-translate-y-1",
        "md:card-image-zoom",
        // Entrance: start invisible, animate in when triggered
        needsEntrance && !showEntrance && !entranceDone && "opacity-0",
        showEntrance && !entranceDone && entranceClass,
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

interface ValueBlockProps {
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
}

function ValueBlock({ heading, description, image, imageAlt, reverse }: ValueBlockProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col md:items-stretch transition-all duration-700 ease-out",
        reverse ? "md:flex-row-reverse" : "md:flex-row",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      )}
    >
      {/* Image */}
      <div className="w-full md:w-1/2">
        <img src={image} alt={imageAlt} className="w-full h-auto md:h-full brightness-90" />
      </div>

      {/* Text */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 py-[6rem] md:px-16 md:py-12 md:min-h-[500px]">
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 tracking-tight">
          {heading}
        </h3>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
  );
}

const instaImages = [instaGrid1, instaGrid2, instaGrid3, instaGrid4, instaGrid5, instaGrid6];

const brandPromises = [
  { icon: Users, label: "Trusted by 500+ Parents" },
  { icon: Heart, label: "Dermatologist Approved" },
  { icon: Truck, label: "Fast Lagos Delivery" },
  { icon: Award, label: "Premium Brands Only" },
  { icon: Shield, label: "Safe for Newborns" },
  { icon: Star, label: "Expert Curated" },
];

const valueBlocks = [
  {
    heading: "Curated to perform",
    description:
      "We research and handpick every product so you don't have to. Only premium, parent-approved brands make it to our shelves.",
    image: valueCurated,
    imageAlt: "Premium baby care products on shelves",
    reverse: false,
  },
  {
    heading: "Honest and Low Prices",
    description:
      "We keep our margins fair so you get premium baby care without the premium markup. Quality essentials at prices that make sense.",
    image: valueSafety,
    imageAlt: "Affordable premium baby care products with price tags",
    reverse: true,
  },
  {
    heading: "Delivered to your doorstep",
    description:
      "Put your essentials on auto-renew and never run out. Flexible scheduling, fast Lagos delivery, and complete peace of mind.",
    image: valueDelivery,
    imageAlt: "Baby care delivery box on doorstep",
    reverse: false,
  },
];

function EntryCardsSection() {
  const isMobile = useIsMobile();
  const [card1Visible, setCard1Visible] = useState(false);
  const [card2Visible, setCard2Visible] = useState(false);

  const handleCard1Visible = useRef(() => setCard1Visible(true)).current;
  const handleCard2Visible = useRef(() => setCard2Visible(true)).current;

  return (
    <div className="flex-1 px-4 py-10 md:py-14 md:pb-20">
      <div className="w-full max-w-6xl mx-auto grid gap-5 md:grid-cols-3">
        <EntryCard
          to="/catalogue"
          image={cardEverything}
          title="Everything You Need"
          description="A wide selection of quality products carefully sourced."
          className={isMobile ? "" : "-rotate-2"}
          style={{ "--card-tilt": "-2deg" } as React.CSSProperties}
          onFullyVisible={handleCard1Visible}
        />
        <EntryCard
          to="/gifting"
          image={cardBundles}
          title="Expertly Curated Gift Bundles"
          description="Thoughtfully researched bundles, ready to gift."
          className={isMobile ? "" : "rotate-1 translate-y-4"}
          style={{ "--card-tilt": "1deg", "--card-offset": "16px" } as React.CSSProperties}
          entranceClass="animate-slide-in-right"
          canEnter={card1Visible}
          onFullyVisible={handleCard2Visible}
        />
        <EntryCard
          to="/subscribe"
          image={cardSubscribe}
          title="Care, Made Continuous"
          description="Auto-renewals of orders so care never runs out."
          className={isMobile ? "" : "-rotate-1"}
          style={{ "--card-tilt": "-1deg" } as React.CSSProperties}
          entranceClass="animate-slide-in-left"
          canEnter={card2Visible}
        />
      </div>
    </div>
  );
}

export function ShopEntry() {
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Full-Bleed Hero Section with border on mobile */}
      <section className="relative min-h-[80vh] md:min-h-[80vh] flex items-center justify-center border-b border-border md:border-b-0">
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
              <Link to="/catalogue">Shop</Link>
            </Button>

            {/* Mobile: Shop button navigates to /catalogue */}
            <Button asChild size="lg" className="md:hidden px-10 py-6 text-lg">
              <Link to="/catalogue">Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Entry Cards */}
      <EntryCardsSection />

      {/* Why Nesta Hub - Coterie-style Value Blocks */}
      <section>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center px-4 py-10 md:py-14">
          Why Nesta Hub?
        </h2>
        {valueBlocks.map((block, i) => (
          <ValueBlock key={i} {...block} />
        ))}
      </section>

      {/* Instagram Community Gallery */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Join the Nesta Community</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Follow us for parenting tips, product highlights, and exclusive offers.
          </p>
        </div>

        {/* Mobile: horizontal scroll strip */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
          {instaImages.map((img, i) => (
            <div key={i} className="shrink-0 w-40 h-40 rounded-xl overflow-hidden snap-start">
              <img src={img} alt="Nesta baby care" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Desktop: 3x2 grid */}
        <div className="hidden md:grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {instaImages.map((img, i) => (
            <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer">
              <img
                src={img}
                alt="Nesta baby care"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/nestahub/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline transition-colors"
          >
            <Instagram className="w-5 h-5" />
            Follow us on Instagram
          </a>
        </div>
      </section>

      {/* Brand Promise Strip */}
      <section className="border-t border-border py-8 md:py-10 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...brandPromises, ...brandPromises].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-2 mx-8 md:mx-12 shrink-0">
              <item.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
