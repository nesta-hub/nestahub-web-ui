import { RefreshCw, Tag, Truck, Wallet } from "lucide-react";
import { TRUST_ITEMS } from "./offers";

const ICONS = [Truck, Tag, RefreshCw, Wallet];

/** Four reasons to shop here, overlapping the bottom of the hero. */
export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="relative z-[2] mx-auto -mt-[30px] max-w-[1680px] px-8">
      <ul className="m-0 grid list-none grid-cols-4 rounded-[28px] border border-[#E8E1D8] bg-shop-cream p-0 shadow-[0_24px_40px_-30px_rgba(51,38,28,0.35)] max-lg:grid-cols-2">
        {TRUST_ITEMS.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <li key={item.title} className={`flex items-center gap-3.5 px-[26px] py-[22px] ${i > 0 ? "border-l border-[#E8E1D8]" : ""}`}>
              <span
                aria-hidden="true"
                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full"
                style={{ background: item.tone.bg, color: item.tone.fg }}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold leading-5">{item.title}</span>
                <span className="block text-[13px] leading-[18px] text-shop-muted">{item.sub}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
