import { Link } from "react-router-dom";
import cardEverything from "@/assets/card-everything.png";
import cardBundles from "@/assets/card-gift-bundles-biege.png";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

export function EntryPostcards() {
  return (
    <section className="container max-w-6xl px-4 md:px-6 py-10 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-card shadow-2xl relative">
        {/* Left: The Everything Baby Shop */}
        <Link
          to="/catalogue"
          className="group bg-nesta-cream p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[440px] md:min-h-[520px]"
        >
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-light tracking-tight leading-tight" style={{ color: "#3c4136" }}>
              The Everything <br />
              <span className="font-medium italic text-nesta-tan">Baby Shop</span>
            </h2>
            <p className="text-xl md:text-2xl text-nesta-tan mt-3 -rotate-2 inline-block" style={handwriting}>
              carefully curated for tiny humans
            </p>
          </div>

          <div className="relative z-10 mt-8 mb-10 md:mt-12 md:mb-16">
            <div className="relative w-full md:w-4/5 aspect-[4/3] rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-[1.03] transition-transform duration-700">
              <img
                src={cardEverything}
                alt="Everything Baby Shop"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-sm text-nesta-sage max-w-[240px] leading-relaxed">
              Your one-stop destination for all baby essentials, curated for quality and fair pricing.
            </p>
          </div>
        </Link>

        {/* Right: Valuable Gifting */}
        <Link
          to="/gifting"
          className="group bg-nesta-sage p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[440px] md:min-h-[520px]"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="80" cy="20" r="40" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 md:text-right">
            <h2 className="text-3xl md:text-[2.75rem] lg:text-5xl font-light text-nesta-cream tracking-tight leading-[1.05]">
              The Ultimate Baby <span className="font-serif italic whitespace-nowrap">& Mom Gifting Center</span>
            </h2>
            <p className="text-xl md:text-2xl text-nesta-cream/80 mt-3" style={handwriting}>
              Perfectly curated gift sets in a stellar box
            </p>
          </div>

          <div className="relative z-10 flex justify-center py-8 md:py-12">
            <div className="relative">
              <div className="w-52 h-52 md:w-72 md:h-72 rounded-full overflow-hidden border-2 border-nesta-cream/20 p-4 md:p-8 flex items-center justify-center bg-nesta-tan/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-1000">
                <img
                  src={cardBundles}
                  alt="Valuable Gifting"
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 md:text-right">
            <p className="text-sm text-nesta-cream/90 max-w-[240px] leading-relaxed md:ml-auto">
              Thoughtfully bundled gift sets and gift cards for the parents-to-be.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
