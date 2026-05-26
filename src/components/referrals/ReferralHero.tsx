import { Button } from "@/components/ui/button";
import { Gift, Users } from "lucide-react";
import { PostcardCollage } from "./PostcardCollage";

interface Props {
  onJoin: () => void;
  onCheckBalance: () => void;
}

export function ReferralHero({ onJoin, onCheckBalance }: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-nesta-cream border border-border shadow-sm"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.045) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-nesta-sage/10 blur-2xl" aria-hidden />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-nesta-tan/15 blur-3xl" aria-hidden />

      <div className="relative grid md:grid-cols-[1.15fr_1fr] gap-8 md:gap-10 items-center px-6 py-8 md:px-14 md:py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-nesta-sage/15 text-nesta-sage px-3 py-1 text-xs font-medium uppercase tracking-wide mb-5">
            <Gift className="w-3.5 h-3.5" />
            Share Nestahub
          </div>

          <h1 className="font-display text-3xl md:text-[2.6rem] font-bold text-foreground leading-[1.1] tracking-tight">
            If you know a nursing mum, she really should hear about <span className="text-nesta-sage">NestaHub</span>.
          </h1>

          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            She's probably looking for fairly priced baby essentials and anything to ease a life that's already full.{" "}
            <span className="text-nesta-sage font-medium">NestaHub</span> changes all that for her — you also get to{" "}
            <span className="text-nesta-sage font-medium">unlock rewards</span> while doing it.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={onJoin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Gift className="w-4 h-4" />
              Start Sharing
            </Button>
            <Button size="lg" variant="outline" onClick={onCheckBalance}>
              <Users className="w-4 h-4" />
              Track my activity
            </Button>
          </div>
        </div>

        <div className="relative">
          <PostcardCollage />
        </div>
      </div>
    </section>
  );
}
