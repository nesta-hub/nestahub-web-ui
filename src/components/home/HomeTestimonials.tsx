const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const testimonials = [
  {
    quote: "I set up a diaper subscription and it just runs in the background. One less thing on my plate.",
    author: "T.A., Lekki",
    bg: "bg-nesta-cream",
  },
  {
    quote:
      "The gift bundle I send to my friend feel like real deliberate gifts, not a random item i picked in a hurry.",
    author: "A.O., Ikoyi",
    bg: "bg-nesta-sage/12",
  },
  {
    quote: "Cashback on every order quietly adds up.super useful.",
    author: "M.E., Yaba",
    bg: "bg-nesta-tan/20",
  },
];

export function HomeTestimonials() {
  return (
    <section className="container max-w-6xl px-4 md:px-6 py-12 md:py-20">
      <div className="max-w-2xl mb-8 md:mb-10">
        <p className="text-xl text-nesta-sage mb-2" style={handwriting}>
          quietly said ✿
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">From the Nesta community</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className={`relative rounded-2xl ${t.bg} border border-nesta-brown/15 p-6 md:p-7 shadow-sm flex flex-col`}
          >
            <span className="font-display text-6xl text-nesta-sage leading-none mb-2" aria-hidden>
              “
            </span>
            <p className="text-foreground leading-relaxed flex-1">{t.quote}</p>
            <p className="mt-5 text-sm font-medium text-nesta-brown/80">— {t.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
