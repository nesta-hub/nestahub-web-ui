import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, ShoppingBag } from "lucide-react";
import closingHero from "@/assets/home/closing-baby-items.jpg";

export function HomeClosingCTA() {
  return (
    <section className="container max-w-6xl px-4 md:px-6 py-10 md:py-16">
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-md">
        <img src={closingHero} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--nesta-cream) / 0.05) 0%, hsl(var(--nesta-cream) / 0.55) 45%, hsl(var(--nesta-cream) / 0.95) 75%, hsl(var(--nesta-tan) / 0.4) 100%)",
          }}
          aria-hidden
        />

        <div className="relative px-6 py-12 md:px-14 md:py-20 flex flex-col md:flex-row md:items-end md:justify-end gap-8">
          <div className="md:max-w-md md:text-right md:ml-auto">
            <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">
              Begin
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.05] tracking-tight">
              Start with your
              <br />
              essentials.
            </h2>
            <p className="mt-4 text-foreground/80 leading-relaxed">
              Build your first order, set up a subscription, or send a gift —
              all in a few taps.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 md:justify-end">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/catalogue">
                  <ShoppingBag className="w-4 h-4" />
                  Shop
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card/80 backdrop-blur-sm">
                <Link to="/gifting">
                  <Gift className="w-4 h-4" />
                  Browse gifts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
