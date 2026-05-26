import { rewards } from "./referralData";

const fmt = new Intl.NumberFormat("en-NG");

// Staggered gallery wall: alternating slight rotations + heights
const tiltClasses = [
  "md:-rotate-1 md:translate-y-0",
  "md:rotate-1 md:translate-y-4",
  "md:-rotate-1 md:-translate-y-2",
  "md:rotate-1 md:translate-y-3",
  "md:-rotate-1 md:translate-y-1",
  "md:rotate-1 md:-translate-y-1",
];

export function RewardsCatalogue() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">
            Rewards catalogue
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Choose your gift when you're ready
          </h2>
          <p className="mt-2 text-muted-foreground">
            Your balance never expires. Save slowly, redeem whenever.
          </p>
        </div>

        {/* Eyebrow row of mini thumbnails — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-2">
            Look inside
          </p>
          {rewards.map((r) => (
            <div
              key={r.id}
              className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border bg-nesta-cream"
            >
              <img src={r.image} alt="" className="w-full h-full object-contain p-0.5" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 md:pt-4 md:pb-6">
        {rewards.map((r, i) => (
          <div
            key={r.id}
            className={`group relative bg-card p-2 md:p-3 pb-3 md:pb-4 rounded-sm shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_22px_44px_-28px_hsl(var(--foreground)/0.28)] ring-1 ring-black/5 transition-transform duration-300 ${tiltClasses[i]} hover:rotate-0 hover:-translate-y-1`}
          >
            {/* Twine + price tag */}
            <div className="absolute -top-2 right-3 z-10 flex flex-col items-center pointer-events-none">
              <span className="w-px h-3 bg-nesta-brown/40" aria-hidden />
              <div className="rotate-[6deg] bg-nesta-cream border border-nesta-brown/25 px-2.5 py-1 rounded-sm shadow-sm relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-nesta-brown/40 bg-card" aria-hidden />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Points</p>
                <p className="text-xs font-semibold text-nesta-brown leading-tight">{fmt.format(r.naira)} pts</p>
              </div>
            </div>

            <div className="aspect-square bg-nesta-cream overflow-hidden">
              <img
                src={r.image}
                alt={r.name}
                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>

            <div className="pt-3 px-1 md:px-2">
              <p className="font-semibold text-sm md:text-base text-foreground leading-tight">
                {r.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
