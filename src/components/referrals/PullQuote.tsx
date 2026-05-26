export function PullQuote() {
  return (
    <section className="py-4 md:py-8">
      <div className="max-w-4xl">
        <div className="w-10 h-px bg-nesta-sage mb-6" aria-hidden />
        <blockquote className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground">
          <span className="text-nesta-sage">&ldquo;</span>
          You are one message away
          <br /> from bringing <span className="text-nesta-sage">joy</span> to a nursing mum
          <span className="text-nesta-sage">&rdquo;</span>
        </blockquote>
      </div>
    </section>
  );
}
