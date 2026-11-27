import { ArrowLeft, ExternalLink, Reply } from "lucide-react";
import nestaLogo from "@/assets/nesta-logo.png";

const ACTIONS = [
  { label: "Pay now", Icon: ExternalLink },
  { label: "Make changes", Icon: ExternalLink },
  { label: "Skip this time", Icon: Reply },
];

/** WhatsApp's chat wallpaper: its beige, with a faint scatter of marks standing in for the doodles. */
const WALLPAPER = {
  backgroundColor: "#EFEAE2",
  backgroundImage:
    "radial-gradient(rgba(84,72,58,0.07) 1.2px, transparent 1.4px), radial-gradient(rgba(84,72,58,0.05) 1px, transparent 1.2px)",
  backgroundSize: "18px 18px, 26px 26px",
  backgroundPosition: "0 0, 9px 13px",
};

/**
 * What the reminder looks like on WhatsApp, as an example with made-up values: a slice of the chat with Nesta Hub,
 * the message arriving on WhatsApp's wallpaper with its three buttons. Only a picture; nothing in it can be tapped.
 */
export function ReminderPreview() {
  return (
    <figure aria-label="An example WhatsApp reminder" className="m-0 mt-3.5">
      <div className="overflow-hidden rounded-[18px] shadow-[0_8px_20px_-12px_rgba(51,38,28,0.5)]">
        {/* The chat's header */}
        <div className="flex h-11 items-center gap-2 bg-[#075E54] px-2.5 text-white">
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src={nestaLogo} alt="" className="h-5 w-auto" />
          </span>
          <span className="text-[14px] font-semibold leading-4">Nesta Hub</span>
        </div>

        {/* The message, on the wallpaper */}
        <div className="px-2.5 pb-3.5 pt-3" style={WALLPAPER}>
          <div className="relative max-w-[290px]">
            {/* The bubble's tail, top left */}
            <svg aria-hidden="true" viewBox="0 0 8 13" className="absolute -left-[7px] top-0 h-[13px] w-2 text-white">
              <path d="M8 0H1.5C.2 0-.4 1.5.5 2.4L8 10z" fill="currentColor" />
            </svg>
            <div className="overflow-hidden rounded-[8px] rounded-tl-none bg-white shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
              <div className="px-2.5 pb-1.5 pt-2 text-[13.5px] leading-[19px] text-[#111B21]">
                <p>
                  Hi Ada, your subscribed item: <b className="font-semibold">Kisskids Diapers ×2</b> is due for renewal. We have an order ready
                  for you.
                </p>
                <p className="mt-2">
                  <b className="font-semibold">Delivery:</b> Saturday
                  <br />
                  <b className="font-semibold">Pay by:</b> Friday, 4pm
                </p>
                <p className="mt-2">You can change or skip this one below.</p>
                <p className="mt-0.5 text-right text-[11px] leading-3 text-[#667781]">9:00</p>
              </div>
              <div className="divide-y divide-[#E9EDEF] border-t border-[#E9EDEF]">
                {ACTIONS.map(({ label, Icon }) => (
                  <span key={label} className="flex h-10 items-center justify-center gap-1.5 text-[14px] font-medium text-[#027EB5]">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
