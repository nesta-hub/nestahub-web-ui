import { Sparkles } from "lucide-react";
import { steps } from "./referralData";

export function SimpleSteps() {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">
          In four steps
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">How it works</h2>
      </div>

      {/* Ticket strip */}
      <div className="relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-dashed divide-nesta-brown/20 md:divide-y-0 md:divide-x">
          {steps.map((s) => (
            <div key={s.n} className="relative p-5 md:p-6 min-h-[150px] flex flex-col justify-between">
              {/* Oversized translucent numeral */}
              <span
                className="absolute -top-2 right-2 font-display font-bold text-[88px] leading-none text-nesta-sage/12 select-none pointer-events-none"
                aria-hidden
              >
                {s.n}
              </span>

              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nesta-sage relative">
                Step {s.n}
              </p>
              <div className="relative">
                <p className="font-semibold text-foreground leading-snug">{s.title}</p>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Perforation notches on the sides */}
        <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-background hidden md:block" aria-hidden />
        <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-background hidden md:block" aria-hidden />
      </div>

      {/* Earning breakdown — ticket style, matches steps strip */}
      <div
        className="relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 shadow-sm overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.04) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        {/* Perforation notches */}
        <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-background hidden md:block" aria-hidden />
        <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-background hidden md:block" aria-hidden />

        <div className="grid md:grid-cols-[auto_1fr] gap-5 md:gap-10 items-center p-5 md:p-7">
          {/* Label */}
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2 md:pr-8 md:border-r md:border-dashed md:border-nesta-brown/25">
            <div className="w-10 h-10 rounded-full bg-nesta-sage/15 text-nesta-sage flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nesta-sage">
                What you earn
              </p>
              <p className="text-sm md:text-base font-semibold text-foreground leading-tight">
                Per referred mum
              </p>
            </div>
          </div>

          {/* Breakdown — receipt rows */}
          <div className="w-full md:max-w-[420px] md:mx-auto space-y-2.5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xl font-bold text-nesta-brown tabular-nums">500</span>
              <span className="flex-1 border-b border-dashed border-nesta-brown/25 translate-y-[-3px]" aria-hidden />
              <span className="text-xs md:text-sm text-muted-foreground">on her first order</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xl font-bold text-nesta-brown tabular-nums">
                20<span className="text-sm font-semibold text-muted-foreground"> × 4</span>
              </span>
              <span className="flex-1 border-b border-dashed border-nesta-brown/25 translate-y-[-3px]" aria-hidden />
              <span className="text-xs md:text-sm text-muted-foreground">on her next 4 orders</span>
            </div>
            <div className="flex items-baseline gap-3 !mt-10 pt-6 border-t border-dashed border-nesta-brown/25">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Up to</span>
              <span className="flex-1" aria-hidden />
              <span className="font-display text-2xl font-bold text-nesta-sage tabular-nums">580 pts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
