import { CalendarHeart, Utensils } from "lucide-react";
import { Layout } from "@/components/layout";

/** The tools that are planned, shown while they are built. */
const TOOLS = [
  {
    icon: CalendarHeart,
    name: "Immunization reminder",
    blurb: "Get reminded when your baby's next vaccine is due.",
    tone: { bg: "#F2E1D6", fg: "#7A4F33" },
  },
  {
    icon: Utensils,
    name: "Baby meal plan",
    blurb: "Simple meal ideas for each stage of weaning.",
    tone: { bg: "#E4EADF", fg: "#46564A" },
  },
];

/**
 * Mum Tools: a set of tools to help mums, none of which exist yet. This is the coming-soon
 * page: an advert for what is on the way, and a card for each tool planned.
 */
export default function MumTools() {
  return (
    <Layout>
      <div className="mx-auto max-w-[900px] px-5 pb-28 pt-6 text-shop-ink md:px-8 md:pb-20 md:pt-10">
        {/* The same title size as the site's other pages: 24px on a phone, 36px on desktop */}
        <h1 className="m-0 text-2xl font-bold leading-8 text-foreground md:text-4xl md:leading-10">Mum Tools</h1>

        <section
          aria-label="Coming soon"
          className="relative mt-5 overflow-hidden rounded-[28px] bg-[#DDE3DA] p-6 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)] md:p-10"
        >
          <span aria-hidden="true" className="absolute -right-12 -top-16 h-[220px] w-[220px] rounded-full bg-[#E6EBE3]" />
          <span aria-hidden="true" className="absolute -bottom-20 right-16 h-[150px] w-[150px] rounded-full bg-[#D2DBD0]" />
          <div className="relative max-w-[480px]">
            <span className="inline-block rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-extrabold leading-3 tracking-[0.14em] text-[#46564A]">
              COMING SOON
            </span>
            <h2 className="m-0 mt-3 text-2xl font-extrabold leading-8 tracking-[-0.02em] md:text-[34px] md:leading-10">
              Tools to help mum through motherhood
            </h2>
            <p className="m-0 mt-2.5 text-sm leading-6 text-[#4A5249] md:text-base md:leading-[25px]">
              We're building a set of simple tools for the early years. Here is what's on the way.
            </p>
          </div>
        </section>

        <ul aria-label="Planned tools" className="m-0 mt-6 grid list-none gap-3 p-0 md:grid-cols-2">
          {TOOLS.map(({ icon: Icon, name, blurb, tone }) => (
            <li key={name} className="flex items-start gap-3.5 rounded-[22px] border border-[#ECE5DB] bg-white p-4">
              <span
                aria-hidden="true"
                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full"
                style={{ background: tone.bg, color: tone.fg }}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold leading-[22px]">{name}</span>
                <span className="mt-0.5 block text-[13.5px] leading-5 text-shop-muted">{blurb}</span>
              </span>
              <span className="flex-none rounded-full bg-shop-page px-2.5 py-1 text-[11px] font-bold leading-[14px] text-shop-muted">Soon</span>
            </li>
          ))}
        </ul>

      </div>
    </Layout>
  );
}
