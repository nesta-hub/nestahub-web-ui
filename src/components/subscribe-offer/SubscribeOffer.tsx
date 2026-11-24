import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import { subscriptionBoxesApi, type OfferLine } from "@/lib/subscriptionBoxes";
import { namesOf } from "./offerText";

/** Up to three little round pictures of the items, overlapping. With no pictures, the Subscribe icon. */
function Faces({ lines }: { lines: OfferLine[] }) {
  const images = [...new Set(lines.map((l) => l.imageUrl).filter((url): url is string => !!url))].slice(0, 3);
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center">
      {images.length ? (
        images.map((url, i) => (
          <span key={url} className={`h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full bg-[#F7F2E9] shadow-[0_0_0_2px_#DDE3DA] ${i > 0 ? "-ml-3" : ""}`}>
            <img src={url} alt="" className="block h-full w-full object-cover" />
          </span>
        ))
      ) : (
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/70 text-shop-brown">
          <RefreshCw className="h-4 w-4" />
        </span>
      )}
    </span>
  );
}

/** The green panel: pictures, a title, a line, and a light button. */
function Panel({ label, lines, title, children, to, action }: { label: string; lines: OfferLine[]; title: string; children: ReactNode; to: string; action: string }) {
  return (
    <section aria-label={label} className="w-full overflow-hidden rounded-[22px] border border-shop-line text-shop-ink">
      <div className="bg-[#DDE3DA] px-4 pb-[18px] pt-4 text-center">
        <Faces lines={lines} />
        <h2 className="mt-2 text-[15px] font-extrabold leading-[19px] tracking-[-0.01em]">{title}</h2>
        <p className="mt-1.5 text-[12.5px] leading-[18px] text-[#46564A]">{children}</p>
        <div className="mt-3.5 flex justify-center">
          <Link to={to} className="flex h-12 items-center justify-center whitespace-nowrap rounded-[24px] bg-white/[0.72] px-7 text-[14px] font-extrabold leading-[18px] text-shop-ink">
            {action}
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Shown on the screens that follow an order: the offer to subscribe to what she just bought, or "You are subscribed"
 * when she already did (from the product page). Shows nothing while it finds out, when there is nothing to say, when
 * the new experience is off for her, or if anything goes wrong: this sits on an order confirmation and must never
 * get in the way of it.
 */
export function SubscribeOffer({ orderNumber }: { orderNumber: string }) {
  const on = useSubscribeEnabled();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const { data } = useQuery({
    queryKey: ["subscribe-offer", orderNumber],
    queryFn: () => subscriptionBoxesApi.offer(accessToken, orderNumber),
    enabled: on && !!accessToken,
    retry: false,
    staleTime: 30_000,
  });

  if (!on || !accessToken || !data) return null;

  if (data.state === "subscribed") {
    const one = data.subscribed.length === 1;
    return (
      <Panel label="Your subscription" lines={data.subscribed} title="You are subscribed" to="/subscriptions" action="View my subscriptions">
        <b className="font-extrabold text-shop-ink">You will not have to worry about forgetting.</b> We remind you on WhatsApp before{" "}
        {one ? "it finishes" : "they finish"}, and you pay with a direct link once you are ready.
      </Panel>
    );
  }

  if (data.state !== "offer" || data.eligible.length === 0) return null;
  const one = data.eligible.length === 1;

  return (
    <Panel
      label="Subscribe to what you just bought"
      lines={data.eligible}
      title={`Never run out of your ${namesOf(data.eligible)}`}
      to={`/subscriptions/setup/${encodeURIComponent(orderNumber)}`}
      action="Subscribe"
    >
      <b className="font-extrabold text-shop-ink">{one ? "Subscribe to this item." : "Subscribe to these items."}</b> We remind you via WhatsApp notifications
      before you run out and send payment links to pay directly without coming back to order again.
    </Panel>
  );
}
