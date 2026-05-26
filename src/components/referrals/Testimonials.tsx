const quotes = [
  {
    body: "Sent the link to two mums from my antenatal class. Got my tote in a week.",
    sig: "A.O., Lekki",
    tone: "cream" as const,
  },
  {
    body: "I love that the points don't expire. I'm saving up slowly for the hoodie.",
    sig: "C.E., Yaba",
    tone: "sage" as const,
  },
  {
    body: "Easiest thing — I already recommend Nestahub. Now I just add my code.",
    sig: "F.A., Ikeja",
    tone: "tan" as const,
  },
];

const toneClasses = {
  cream: "bg-nesta-cream",
  sage: "bg-nesta-sage/12",
  tan: "bg-nesta-tan/20",
};

export function Testimonials() {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">
          From the circle
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Mums who've already shared
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {quotes.map((q, i) => (
          <figure
            key={i}
            className={`relative rounded-2xl p-6 md:p-7 ${toneClasses[q.tone]} border border-border/40 flex flex-col`}
          >
            <span
              className="absolute top-2 left-4 font-display text-7xl text-nesta-sage/30 leading-none select-none pointer-events-none"
              aria-hidden
            >
              “
            </span>
            <blockquote className="relative text-foreground leading-relaxed pt-6">
              {q.body}
            </blockquote>
            <figcaption className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              — {q.sig}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
