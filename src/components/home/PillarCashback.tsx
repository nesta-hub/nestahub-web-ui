import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const chips = [
  { label: "automatic", tilt: "-rotate-3" },
  { label: "never expires", tilt: "rotate-2" },
  { label: "spend on anything", tilt: "-rotate-1" },
];

export function PillarCashback() {
  return (
    <section className="relative overflow-hidden">
      {/* Sage-tinted band */}
      <div
        className="relative px-4 py-14 md:px-10 md:py-20"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--nesta-sage) / 0.12) 0%, hsl(var(--nesta-cream)) 60%, hsl(var(--nesta-sage) / 0.18) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Stamped receipt */}
          <div className="relative max-w-sm mx-auto w-full">
            <div
              className="relative bg-nesta-cream shadow-[0_22px_50px_-28px_hsl(var(--foreground)/0.4)] ring-1 ring-black/5 -rotate-[3deg] p-6 pb-10"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 12px), 95% 100%, 90% calc(100% - 12px), 85% 100%, 80% calc(100% - 12px), 75% 100%, 70% calc(100% - 12px), 65% 100%, 60% calc(100% - 12px), 55% 100%, 50% calc(100% - 12px), 45% 100%, 40% calc(100% - 12px), 35% 100%, 30% calc(100% - 12px), 25% 100%, 20% calc(100% - 12px), 15% 100%, 10% calc(100% - 12px), 5% 100%, 0 calc(100% - 12px))",
              }}
            >
              <p className="text-center text-[10px] uppercase tracking-[0.3em] text-nesta-brown/70 mb-1">Nesta Hub</p>
              <p className="text-center text-[11px] text-muted-foreground font-mono mb-5">Order · #00472</p>

              <div className="space-y-2 font-mono text-xs text-foreground border-t border-dashed border-nesta-brown/30 pt-4">
                <Row label="Bath set" amount="₦8,500" />
                <Row label="Muslin x3" amount="₦9,600" />
                <Row label="Onesie" amount="₦4,500" />
                <Row label="Delivery" amount="Free" />
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-nesta-brown/30 font-mono text-sm flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-semibold text-foreground">₦22,600</span>
              </div>

              {/* Tilted cashback stamp */}
              <div className="absolute -right-3 top-12 -rotate-[12deg]">
                <div className="border-[2.5px] border-nesta-sage rounded-md px-3 py-1.5 bg-nesta-cream/90 shadow-sm">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-nesta-sage/80 leading-tight">Cashback</p>
                  <p className="text-lg font-bold text-nesta-sage leading-tight">+₦100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="max-w-md">
            <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
              earn while you shop ✿
            </p>
            <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">— The rewards</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
              Every order
              <br />
              earns you back.
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              Get cashback on every single order, credited automatically to your Nesta wallet. Spend it on anything in
              the shop, no rules, no expiry.
            </p>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="mt-7 border-nesta-sage/50 text-nesta-sage hover:bg-nesta-sage/10 hover:text-nesta-sage bg-card/60 backdrop-blur-sm"
            >
              <Link to="/referrals">
                See how it works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <div className="mt-7 flex flex-wrap gap-3">
              {chips.map((c) => (
                <span
                  key={c.label}
                  className={`inline-block bg-card border border-nesta-brown/25 rounded-md px-3 py-1.5 shadow-sm text-base text-nesta-brown ${c.tilt}`}
                  style={handwriting}
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{amount}</span>
    </div>
  );
}
