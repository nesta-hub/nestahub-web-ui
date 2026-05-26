import { Button } from "@/components/ui/button";
import { Gift, Users } from "lucide-react";
import closingHero from "@/assets/referrals/closing-hero.jpg";

interface Props {
  onJoin: () => void;
  onCheckBalance: () => void;
}

export function JoinCTA({ onJoin, onCheckBalance }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-md">
      {/* Background photo */}
      <img
        src={closingHero}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Warm cream overlay — sits on the photo, fades in from the right */}
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
          <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">One message</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.05] tracking-tight">
            It starts with
            <br />
            one message.
          </h2>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            Think of one nursing mum in your life. She's already looking for what Nestahub offers — she just doesn't
            know it exists yet. Get your code, send one message, and let us handle the rest.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 md:justify-end">
            <Button size="lg" onClick={onJoin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Gift className="w-4 h-4" />
              Start Sharing
            </Button>
            <Button size="lg" variant="outline" onClick={onCheckBalance} className="bg-card/80 backdrop-blur-sm">
              <Users className="w-4 h-4" />
              View my activity
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
