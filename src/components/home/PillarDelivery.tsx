import { MapPin } from "lucide-react";
import deliveryImg from "@/assets/home/pillar-delivery.jpg";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const steps = [
  { n: "1", title: "You order", body: "Pick what you need from the catalogue." },
  { n: "2", title: "We pack", body: "Carefully wrapped, ready for the road." },
  { n: "3", title: "We deliver", body: "Straight to your door, on your schedule." },
];

export function PillarDelivery() {
  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed cream → tan band */}
      <div
        className="relative px-4 py-14 md:px-10 md:py-20"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--nesta-cream)) 0%, hsl(var(--nesta-cream)) 55%, hsl(var(--nesta-tan) / 0.45) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.4)] ring-1 ring-black/5">
              <img
                src={deliveryImg}
                alt="A Nesta Hub delivery box on a doorstep"
                className="w-full h-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
            {/* Hand-written sticker chip */}
            <div className="absolute -bottom-4 -right-2 md:-right-6 bg-nesta-cream border border-nesta-brown/30 rounded-md px-4 py-2 shadow-md rotate-[4deg]">
              <p className="flex items-center gap-1.5 text-base text-nesta-brown" style={handwriting}>
                <MapPin className="w-4 h-4 text-nesta-sage" />
                Delivery as low as ₦500
              </p>
            </div>
          </div>

          {/* Text */}
          <div className="max-w-md">
            <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
              on your doorstep ✿
            </p>
            <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-3">— The convenience</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
              Delivered to
              <br />
              your doorstep.
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              No more last-minute runs to the store. Fast, careful Lagos delivery.
            </p>
          </div>
        </div>

        {/* Perforated ticket strip */}
        <div className="max-w-6xl mx-auto mt-12 md:mt-16">
          <div className="relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-dashed divide-nesta-brown/20 md:divide-y-0 md:divide-x md:divide-dashed">
              {steps.map((s) => (
                <div key={s.n} className="relative p-5 md:p-6 min-h-[140px] flex flex-col justify-between">
                  <span
                    className="absolute -top-2 right-3 font-display font-bold text-[88px] leading-none text-nesta-sage/15 select-none pointer-events-none"
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nesta-sage relative">
                    Step {s.n}
                  </p>
                  <div className="relative">
                    <p className="font-semibold text-foreground leading-snug">{s.title}</p>
                    <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
