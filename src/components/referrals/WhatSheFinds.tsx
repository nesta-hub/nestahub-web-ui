import { ShoppingBag, Truck, RefreshCw } from "lucide-react";

const items = [
  {
    Icon: ShoppingBag,
    title: "Baby Essentials at low prices",
    body: "Everything a nursing mum needs in one place, at prices cheaper than she currently buys them.",
  },
  {
    Icon: Truck,
    title: "Delivered to her door",
    body: "No market runs. No stress. It comes to her, on her schedule.",
  },
  {
    Icon: RefreshCw,
    title: "Auto-reorder for the staples",
    body: "She can set up a subscription on her go-to essentials, so she never runs out and has one less thing to remember.",
  },
];

export function WhatSheFinds() {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">
          What she'll find at NestaHub
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Things she'll be glad about.</h2>
        <p className="mt-2 text-muted-foreground">This is what you're passing on.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {items.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl bg-nesta-cream border border-nesta-brown/15 p-6 md:p-7 shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_18px_40px_-24px_hsl(var(--foreground)/0.2)] flex flex-col"
          >
            <div className="w-11 h-11 rounded-full bg-nesta-sage/15 text-nesta-sage flex items-center justify-center mb-4">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground leading-snug">{title}</h3>
            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
