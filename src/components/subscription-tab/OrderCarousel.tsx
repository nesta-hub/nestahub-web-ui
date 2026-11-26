import { Children, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * More than one order card (one to pay, one paid and on its way): side by side, swiped between, with a sliver of the
 * next card showing at the edge and dots under them. The page bleeds the row to the screen's edges, like the shop's offers.
 */
export function OrderCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const step = () => {
    const cards = track.current?.querySelectorAll<HTMLElement>("[data-order-slide]");
    return cards && cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
  };
  const goTo = (i: number) => track.current?.scrollTo?.({ left: i * step(), behavior: "smooth" });
  const onScroll = () => {
    const s = step();
    if (track.current && s > 0) setIndex(Math.min(slides.length - 1, Math.round(track.current.scrollLeft / s)));
  };

  return (
    <section aria-label="Your orders" aria-roledescription="carousel" className="-mx-5">
      <div ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory scroll-pl-5 items-start gap-2.5 overflow-x-auto px-5 pb-5 pt-1 scrollbar-hide">
        {slides.map((slide, i) => (
          <div
            key={i}
            data-order-slide
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className="w-[calc(100%-2px)] flex-none snap-start"
          >
            {slide}
          </div>
        ))}
        <span aria-hidden="true" className="w-2 flex-none" />
      </div>
      <div className="-mt-2 flex items-center justify-center gap-[5px]">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show order ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className="flex h-6 items-center px-0.5"
          >
            <span className={cn("block h-[5px] rounded-[3px] transition-all duration-300", i === index ? "w-[18px] bg-shop-brown" : "w-1.5 bg-[rgba(51,38,28,0.28)]")} />
          </button>
        ))}
      </div>
    </section>
  );
}
