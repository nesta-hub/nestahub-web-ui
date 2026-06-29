import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroLifestyle from "@/assets/hero-lifestyle-new.webp";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

export function HomeHero() {
  return (
    <section className="relative min-h-[72vh] md:min-h-[70vh] lg:min-h-[75vh] flex items-center justify-center overflow-hidden border-b border-border md:border-b-0">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroLifestyle} alt="Premium baby care products" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-image-overlay" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 container px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight" style={{ color: "#3c4136" }}>
            <span className="block">Welcome to</span>
            <span className="block">Nesta Hub</span>
          </h1>
          <div className="w-12 h-px bg-nesta-sage mx-auto my-5" aria-hidden />
          <p className="text-2xl md:text-4xl font-bold md:font-normal text-nesta-sage mb-10 max-w-xl mx-auto leading-tight" style={handwriting}>
            Essential baby needs, delivered to doorsteps
          </p>

          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="px-10 py-6 text-base bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/catalogue">Shop Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
