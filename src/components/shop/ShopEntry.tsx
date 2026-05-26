import { Heart, Truck, Award, Users, Instagram, Shield, Star } from "lucide-react";
import instaGrid1 from "@/assets/insta-grid-1.jpg";
import instaGrid2 from "@/assets/insta-grid-2.jpg";
import instaGrid3 from "@/assets/insta-grid-3.jpg";
import instaGrid4 from "@/assets/insta-grid-4.jpg";
import instaGrid5 from "@/assets/insta-grid-5.jpg";
import instaGrid6 from "@/assets/insta-grid-6.jpg";

import { HomeHero } from "@/components/home/HomeHero";
import { HomePullQuote } from "@/components/home/HomePullQuote";
import { EntryPostcards } from "@/components/home/EntryPostcards";
import { PillarShop } from "@/components/home/PillarShop";
import { PillarDelivery } from "@/components/home/PillarDelivery";
import { PillarSubscribe } from "@/components/home/PillarSubscribe";
import { PillarGifting } from "@/components/home/PillarGifting";
import { PillarCashback } from "@/components/home/PillarCashback";
import { HomeTestimonials } from "@/components/home/HomeTestimonials";
import { HomeClosingCTA } from "@/components/home/HomeClosingCTA";

const handwriting = { fontFamily: "'Caveat', 'Brush Script MT', cursive" } as const;

const instaImages = [instaGrid1, instaGrid2, instaGrid3, instaGrid4, instaGrid5, instaGrid6];

const brandPromises = [
  { icon: Users, label: "Trusted by 500+ Parents" },
  { icon: Heart, label: "Dermatologist Approved" },
  { icon: Truck, label: "Fast Lagos Delivery" },
  { icon: Award, label: "Premium Brands Only" },
  { icon: Shield, label: "Safe for Newborns" },
  { icon: Star, label: "Expert Curated" },
];

export function ShopEntry() {
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-8">
      <HomeHero />

      <HomePullQuote />

      <EntryPostcards />

      <PillarShop />

      <PillarDelivery />

      <PillarSubscribe />

      <PillarGifting />

      <PillarCashback />

      <HomeTestimonials />

      {/* Instagram Community Gallery */}
      <section className="container max-w-6xl px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-8">
          <p className="text-xl text-nesta-sage mb-1" style={handwriting}>
            @nestahub
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Join the Nesta Community</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Follow us for parenting tips, product highlights, and exclusive offers.
          </p>
        </div>

        <div className="md:hidden flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
          {instaImages.map((img, i) => (
            <div key={i} className="shrink-0 w-40 h-40 rounded-xl overflow-hidden snap-start">
              <img src={img} alt="Nesta baby care" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {instaImages.map((img, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-rotate-1"
            >
              <img
                src={img}
                alt="Nesta baby care"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/nestahub/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline transition-colors"
          >
            <Instagram className="w-5 h-5" />
            Follow us on Instagram
          </a>
        </div>
      </section>

      <HomeClosingCTA />

      {/* Brand Promise Strip */}
      <section className="border-t border-border py-8 md:py-10 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...brandPromises, ...brandPromises].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-2 mx-8 md:mx-12 shrink-0">
              <item.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
