import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const days = Array.from({ length: 30 }, (_, i) => i + 1);
const deliveryDays = [8, 22];
const chips = [
  { label: "skip anytime", tilt: "-rotate-3" },
  { label: "pause anytime", tilt: "rotate-2" },
  { label: "5% off every order", tilt: "-rotate-1" },
];

export function PillarSubscribe() {
  return (
    <section className="container max-w-6xl px-4 md:px-6 py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Text */}
        <div className="max-w-md">
          <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
            set it & forget it
          </p>
          <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">— The subscription</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
            Never run out
            <br />
            of the essentials.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Put diapers, wipes and bath time on auto-renew. We send a friendly reminder before each order, so you're
            always in control.
          </p>
          <Button asChild size="lg" className="mt-7 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/subscribe">
              Set up a subscription
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          {/* Sticker chips */}
          <div className="mt-7 flex flex-wrap gap-3">
            {chips.map((c) => (
              <span
                key={c.label}
                className={`inline-block bg-nesta-cream border border-nesta-brown/25 rounded-md px-3 py-1.5 shadow-sm text-base text-nesta-brown ${c.tilt}`}
                style={handwriting}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Calendar mockup */}
        <div className="relative">
          <div
            className="relative rounded-2xl bg-nesta-cream border border-nesta-brown/20 shadow-[0_22px_50px_-28px_hsl(var(--foreground)/0.35)] p-6 md:p-8 md:-rotate-2"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.04) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-nesta-brown/70">This month</p>
              <p className="font-display text-xl font-semibold text-foreground">June</p>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <p key={i} className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                  {d}
                </p>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const isDelivery = deliveryDays.includes(d);
                return (
                  <div
                    key={d}
                    className={`aspect-square rounded-full flex items-center justify-center text-xs ${
                      isDelivery
                        ? "bg-nesta-sage text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Handwritten note pointing at a delivery */}
            <div className="absolute top-20 -right-2 md:-right-6 rotate-[8deg]">
              <p className="text-xl text-nesta-sage" style={handwriting}>
                diapers arrive ✿
              </p>
              <svg className="w-10 h-6 text-nesta-sage/60 -mt-1 ml-2" viewBox="0 0 40 24" fill="none" aria-hidden>
                <path d="M2 22 Q 18 18, 32 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path
                  d="M28 6 L 32 8 L 28 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Reminder sticker */}
            <div className="absolute -bottom-3 -left-3 rotate-[-6deg] bg-card border border-nesta-brown/25 rounded-md px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-nesta-sage" />
              <span className="text-xs font-medium text-nesta-brown">reminder sent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
