export function HomePullQuote() {
  return (
    <section className="container max-w-5xl px-4 md:px-6 py-12 md:py-20">
      <div className="w-10 h-px bg-nesta-sage mb-6" aria-hidden />
      <blockquote className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground">
        <span className="text-nesta-sage">“</span>
        Baby essentials.
        <br /> At lower prices.
        <br /> Delivered to your doorstep.
        <span className="text-nesta-sage">”</span>
      </blockquote>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        — the Nesta Hub promise
      </p>
    </section>
  );
}
