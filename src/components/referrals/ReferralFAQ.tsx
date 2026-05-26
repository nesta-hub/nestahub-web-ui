import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq } from "./referralData";

const stickers = [
  { label: "Never expires", rot: "-rotate-2", tone: "bg-nesta-sage/15 text-nesta-sage" },
  { label: "Cumulative balance", rot: "rotate-1", tone: "bg-nesta-tan/25 text-nesta-brown" },
  { label: "Lagos delivery", rot: "-rotate-1", tone: "bg-nesta-cream text-foreground" },
  { label: "Stack points", rot: "rotate-2", tone: "bg-nesta-sage/15 text-nesta-sage" },
];

export function ReferralFAQ() {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">Good to know</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Frequently asked</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl bg-card border border-border px-5 md:px-7 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faq.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Sticker stack — desktop only */}
        <aside className="hidden md:flex flex-col items-start gap-4 pt-4 pl-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The fine print, in short</p>
          {stickers.map((s) => (
            <span
              key={s.label}
              className={`${s.rot} ${s.tone} inline-flex items-center px-4 py-2 rounded-md shadow-sm border border-border/40 text-sm font-medium`}
            >
              {s.label}
            </span>
          ))}
        </aside>
      </div>
    </section>
  );
}
