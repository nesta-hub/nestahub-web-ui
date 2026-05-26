import { Check, Sparkles } from "lucide-react";
import phone from "@/assets/referrals/hero-phone.png";

export function PostcardCollage() {
  return (
    <div className="relative w-full flex justify-center items-center py-10 md:py-14">
      {/* Order Completed card — back-right, tilted */}
      <div className="absolute -top-8 md:-top-2 right-0 md:-right-6 z-40 w-44 md:w-52 -rotate-[5deg] bg-white rounded-2xl border border-nesta-cream p-4 md:p-5 shadow-2xl shadow-foreground/10 transition-transform duration-300 hover:rotate-1 mt-[15px] md:mt-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-nesta-sage/15 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-nesta-sage" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
              Order #N2481
            </p>
            <p className="text-sm font-bold text-foreground leading-tight mt-1">Delivered</p>
          </div>
        </div>
        <div className="pt-3 border-t border-border/60">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
            AMAKA · LAGOS
          </span>
        </div>
      </div>

      {/* Phone — the hero, prominent */}
      <div className="relative z-20 w-[260px] md:w-[300px] drop-shadow-2xl">
        <img
          src={phone}
          alt="WhatsApp chat introducing a friend to Nestahub"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Points Ticket — front-right, tilted, ticket notch */}
      <div className="absolute bottom-2 -right-2 md:-right-8 z-50 w-48 md:w-56 rotate-[3deg] bg-nesta-sage text-white rounded-3xl shadow-2xl shadow-nesta-sage/30 p-5 md:p-6 flex items-center gap-4 border-l-[6px] border-dashed border-white/30">
        <div
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-nesta-cream"
          aria-hidden
        />
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-nesta-cream" />
        </div>
        <div className="leading-none">
          <p className="font-display text-3xl font-black tracking-tight mb-1 tabular-nums">+500</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
            Points Earned
          </p>
        </div>
      </div>
    </div>
  );
}
