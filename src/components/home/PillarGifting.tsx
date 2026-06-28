import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { themeGradients, themeTextColors } from "@/components/gifting/giftCardThemeStyles";
import giftBundleGreen from "@/assets/card-gift-bundles-green.webp";
import giftBundle from "@/assets/card-gift-bundles.webp";
import giftBundleBiege from "@/assets/card-gift-bundles-biege.webp";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

export function PillarGifting() {
  return (
    <section className="container max-w-6xl px-4 md:px-6 py-12 md:py-20">
      <div className="max-w-2xl mb-10 md:mb-12">
        <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
          practical & thoughtful
        </p>
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">— The gifting</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Gifting, made
          <br />
          to mean something.
        </h2>
        <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
          Two meaningful ways to celebrate the new mum in your life.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* Gift cards postcard */}
        <Link
          to="/gifting/cards"
          className="group relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 p-6 md:p-7 shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_22px_50px_-28px_hsl(var(--foreground)/0.3)] flex flex-col md:hover:-translate-y-1 transition-transform"
        >
          <div className="flex items-start justify-between mb-5">
            <p className="font-display text-[11px] uppercase tracking-[0.25em] text-nesta-brown/70">· Gift cards</p>
            <p className="text-base text-nesta-sage -rotate-3" style={handwriting}>
              from one mum to another
            </p>
          </div>

          {/* Mini gift card preview */}
          <div className="relative my-4 mx-auto w-full max-w-[280px] aspect-[16/10]">
            <div
              className="absolute inset-0 rounded-xl shadow-[0_18px_40px_-20px_hsl(var(--foreground)/0.35)] -rotate-[3deg] p-5 flex flex-col justify-between"
              style={{
                background: themeGradients["welcome-world"],
                color: themeTextColors["welcome-world"],
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em] opacity-70">Nesta Hub</p>
              <div>
                <p className="text-xl font-display font-semibold leading-tight">Welcome to the world</p>
                <p className="text-xs mt-1 opacity-70">A gift from a friend</p>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-xl shadow-md rotate-[4deg] translate-x-3 translate-y-3 -z-10 opacity-70"
              style={{ background: themeGradients["little-sunshine"] }}
              aria-hidden
            />
          </div>

          <h3 className="mt-2 text-xl font-semibold text-foreground">Gift cards</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">
            Five beautiful themes. Personal message. Delivered by WhatsApp or email.
          </p>

          <div className="mt-5 flex items-center gap-1.5 text-nesta-brown text-sm font-medium">
            Send a gift card
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Gift bundles postcard */}
        <Link
          to="/gifting"
          className="group relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 p-6 md:p-7 shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_22px_50px_-28px_hsl(var(--foreground)/0.3)] flex flex-col md:hover:-translate-y-1 transition-transform"
        >
          <div className="flex items-start justify-between mb-5">
            <p className="font-display text-[11px] uppercase tracking-[0.25em] text-nesta-brown/70">· Gift bundles</p>
            <p className="text-base text-nesta-sage -rotate-3" style={handwriting}>
              ready to gift
            </p>
          </div>

          {/* Mini polaroid trio */}
          <div className="relative my-4 mx-auto w-full max-w-[280px] aspect-[16/10]">
            {[
              { img: giftBundleGreen, tilt: "-rotate-6", x: "left-0", z: "z-10" },
              { img: giftBundleBiege, tilt: "rotate-2", x: "left-1/2 -translate-x-1/2", z: "z-20" },
              { img: giftBundle, tilt: "rotate-6", x: "right-0", z: "z-10" },
            ].map((p, i) => (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-[42%] aspect-square bg-card p-1.5 pb-5 rounded-sm shadow-lg ring-1 ring-black/5 ${p.tilt} ${p.x} ${p.z}`}
              >
                <div className="w-full h-full overflow-hidden">
                  <img src={p.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-2 text-xl font-semibold text-foreground">Gift bundles</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">
            Stage-matched bundles of premium essentials — beautifully boxed, ready to gift.
          </p>

          <div className="mt-5 flex items-center gap-1.5 text-nesta-brown text-sm font-medium">
            Browse bundles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </section>
  );
}
