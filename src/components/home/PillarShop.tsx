import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import shop1 from "@/assets/home/pillar-shop-1.jpg";
import shop2 from "@/assets/home/pillar-shop-2.jpg";
import shop3 from "@/assets/home/pillar-shop-3.jpg";
import shop4 from "@/assets/home/pillar-shop-4.jpg";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const items = [
  { img: shop1, label: "Formulas", price: "from ₦9,300", tilt: "md:-rotate-2 md:translate-y-0" },
  { img: shop2, label: "Wipes", price: "from ₦700", tilt: "md:rotate-1 md:translate-y-6" },
  { img: shop3, label: "Bath & care", price: "from ₦1,300", tilt: "md:-rotate-1 md:-translate-y-2" },
  { img: shop4, label: "Diapers", price: "from ₦5,900", tilt: "md:rotate-2 md:translate-y-3" },
];

export function PillarShop() {
  return (
    <section id="pillar-shop" className="container max-w-6xl px-4 md:px-6 py-12 md:py-20 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Gallery wall (desktop) / carousel (mobile) */}
        <div className="order-2 md:order-1 min-w-0">
          {/* Mobile carousel — contained, no page overflow */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-4 pb-4 w-max">
              {items.map((it) => (
                <Polaroid key={it.label} {...it} tilt="" mobile />
              ))}
            </div>
          </div>
          {/* Desktop gallery wall */}
          <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-10 py-4">
            {items.map((it) => (
              <Polaroid key={it.label} {...it} />
            ))}
          </div>
        </div>

        {/* Text */}
        <div className="order-1 md:order-2 max-w-md">
          <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
            low prices, no compromises
          </p>
          <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">— The shop</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
            Everything baby,
            <br />
            at low prices.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            We hand-pick premium brands and keep our margins fair, so you get quality essentials without the expensive
            markup.
          </p>
          <Button asChild size="lg" className="mt-7 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/catalogue">
              Shop the catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Polaroid({
  img,
  label,
  price,
  tilt,
  mobile,
}: {
  img: string;
  label: string;
  price: string;
  tilt: string;
  mobile?: boolean;
}) {
  return (
    <div
      className={`relative bg-card p-2.5 pb-9 rounded-sm shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_22px_44px_-28px_hsl(var(--foreground)/0.28)] ring-1 ring-black/5 transition-transform duration-300 hover:rotate-0 hover:-translate-y-1 ${tilt} ${
        mobile ? "shrink-0 w-44 snap-start" : ""
      }`}
    >
      {/* Twine + price tag */}
      <div className="absolute -top-2 right-3 z-10 flex flex-col items-center pointer-events-none">
        <span className="w-px h-3 bg-nesta-brown/40" aria-hidden />
        <div className="rotate-[6deg] bg-nesta-cream border border-nesta-brown/25 px-2 py-0.5 rounded-sm shadow-sm">
          <p className="text-[10px] font-semibold text-nesta-brown leading-tight whitespace-nowrap">{price}</p>
        </div>
      </div>

      <div className="aspect-square bg-nesta-cream overflow-hidden">
        <img src={img} alt={label} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <p className="absolute bottom-1.5 left-0 right-0 text-center text-base text-nesta-brown/80" style={handwriting}>
        {label}
      </p>
    </div>
  );
}
