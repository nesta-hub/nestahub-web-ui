import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Trash } from "lucide-react";
import { formatPrice, getPickupStations } from "@/lib/api";
import { CheckoutAddressSection } from "@/components/checkout/CheckoutAddressSection";
import { brandedName, formatDay, type Box, type DeliveryOptions, type LocationInput } from "@/lib/subscriptionBoxes";
import { cn } from "@/lib/utils";
import { BigButton, BottomSheet, MenuRow } from "./BottomSheet";
import { Thumb } from "./Thumb";
import { METHOD_LABEL, availableMethods, chosenMethod, instantIsForThisOrderOnly, nothingDeliversThere, type Method } from "./deliveryMethods";

type Panel = "menu" | "remove" | "date" | "location";

const TITLES: Record<Panel, [string, string]> = {
  menu: ["Make changes", "What would you like to change?"],
  remove: ["Remove an item", "Choose what to take out of this order"],
  date: ["Change delivery date", "For this order only"],
  location: ["Change delivery method", "How should this order reach you?"],
};

/** How and where this order goes now, for the menu: "Community Delivery · 12 Ifako St", "Pick-up · Yaba station". */
function deliveryNow(box: Box): string {
  const { type, address, pickupStationName } = box.delivery;
  if (!type) return "Not set yet";
  const where = type === "pickup" ? pickupStationName : address;
  return where ? `${METHOD_LABEL[type]} · ${where}` : METHOD_LABEL[type];
}

/**
 * Under the delivery days: which days these are. Community Delivery only comes on its area's days, so for another day
 * she changes the method to Instant Delivery first (a link takes her there).
 */
function DateHint({ box, onChangeMethod }: { box: Box; onChangeMethod: () => void }) {
  const hint = "mt-3.5 text-[12.5px] leading-[18px] text-[#6B5F55]";
  switch (box.delivery.type) {
    case "community":
      return (
        <p className={hint}>
          These are the next Community Delivery days for your area. For a different day, change the delivery method to Instant
          Delivery first, then pick the day.{" "}
          <button type="button" onClick={onChangeMethod} className="-my-2 inline py-2 font-semibold text-shop-brown underline underline-offset-[3px]">
            Change delivery method
          </button>
        </p>
      );
    case "instant":
      return <p className={hint}>These are the next days we deliver by Instant Delivery. Pick one and save.</p>;
    case "pickup":
      return <p className={hint}>These are the next pick-up days at {box.delivery.pickupStationName ?? "your station"}. Pick one and save.</p>;
    default:
      return <p className={hint}>These are the next days we deliver to you. Pick one and save.</p>;
  }
}

interface Props {
  box: Box | null;
  open: boolean;
  /** Open on a particular panel (the location one, when she has not said where to deliver). */
  startOn?: Panel;
  busy: boolean;
  onClose: () => void;
  onLeaveOut: (subscriptionId: string) => Promise<boolean>;
  /** Take a one-time extra out of the order (a subscription item goes through `onLeaveOut`). */
  onRemoveExtra: (lineId: string) => Promise<boolean>;
  onMoveDay: (date: string) => Promise<boolean>;
  onChangeLocation: (location: LocationInput) => Promise<boolean>;
  /** Which ways of delivering to an address this order could use, and what each costs. */
  loadDeliveryOptions: (lat: number, lng: number) => Promise<DeliveryOptions>;
  /** Her last delivery address: where an order going to a pick-up station could be delivered instead. */
  lastAddress?: { address: string; lat: number; lng: number } | null;
}

// The design's pills and radios: the picked one in the light brown #A08B76, as in the Change size panel.
const pill = (on: boolean) =>
  cn("h-10 whitespace-nowrap rounded-[20px] border px-4 text-[14px] font-medium", on ? "border-[#A08B76] bg-[#A08B76]/10 text-[#A08B76]" : "border-[#E5E0DC] text-shop-ink");

function Radio({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2", on ? "border-[#A08B76]" : "border-[#CFC6BC]")}>
      {on && <span className="h-2.5 w-2.5 rounded-full bg-[#A08B76]" />}
    </span>
  );
}

/** Everything she can change about one order, in one drawer: take an item out, pick another day, send it somewhere else. */
export function MakeChangesDrawer({ box, open, startOn = "menu", busy, onClose, onLeaveOut, onRemoveExtra, onMoveDay, onChangeLocation, loadDeliveryOptions, lastAddress = null }: Props) {
  const [panel, setPanel] = useState<Panel>(startOn);
  const [day, setDay] = useState<string | null>(null);
  /** What she has tapped. Null until she does: then the first method on offer is the one shown. */
  const [choice, setChoice] = useState<Method | null>(null);
  const [address, setAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const [scope, setScope] = useState<"box" | "future">("box");
  const [addingAddress, setAddingAddress] = useState(false);

  // Each time it opens, start fresh from what the order has now.
  useEffect(() => {
    if (!open || !box) return;
    setPanel(startOn);
    setDay(box.deliveryDate);
    setChoice(box.delivery.type);
    // Going to a station, it has no address: start from her last one, so the methods that deliver there are offered.
    setAddress(box.delivery.address && box.delivery.lat !== null && box.delivery.lng !== null ? { address: box.delivery.address, lat: box.delivery.lat, lng: box.delivery.lng } : lastAddress);
    setStationId(box.delivery.pickupStationId);
    setScope("box");
    setAddingAddress(false);
  }, [open, box?.id, startOn]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: stations = [] } = useQuery({ queryKey: ["pickup-stations"], queryFn: getPickupStations, enabled: open && panel === "location" });
  // What the server says about the address she is looking at: which ways it can be delivered to, and the price of each.
  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ["box-delivery-options", box?.id, address?.lat, address?.lng],
    queryFn: () => loadDeliveryOptions(address!.lat, address!.lng),
    enabled: open && panel === "location" && !!box && !!address,
    staleTime: 60_000,
    retry: false,
  });

  if (!box) return null;
  const [title, subtitle] = TITLES[panel];
  const days = [{ date: box.deliveryDate }, ...box.openDays.filter((d) => d.date !== box.deliveryDate)].sort((a, b) => (a.date < b.date ? -1 : 1));
  const addressIsCurrentCommunity = box.delivery.type === "community" && !!address && address.address === box.delivery.address;
  const available = availableMethods({ options, addressIsCurrentCommunity });
  const method = chosenMethod(choice, available);
  const noDelivery = nothingDeliversThere(options);
  const thisOrderOnly = instantIsForThisOrderOnly(method, available);
  // Until the server has said which methods this address can use, we do not know what she would be choosing (the list
  // below is only a guess), so an address method cannot be saved yet.
  const waitingForOptions = method !== "pickup" && !!address && optionsLoading;
  const canSaveLocation = method === "pickup" ? !!stationId : !!address && !waitingForOptions;
  /** What each way costs, once the server has said (pick-up is free). Undefined while it is not known. */
  const feeOf = (m: Method): number | null | undefined => (m === "community" ? options?.community?.feeKobo : m === "instant" ? options?.instant?.feeKobo : 0);
  const pillText = (m: Method) => {
    const fee = waitingForOptions && m !== "pickup" ? undefined : feeOf(m);
    return fee === undefined || fee === null ? METHOD_LABEL[m] : `${METHOD_LABEL[m]} · ${fee === 0 ? "Free" : formatPrice(fee)}`;
  };
  // An order lives on its subscription items: the last one cannot be taken out (extras ride along and go with it).
  const subscriptionLines = box.items.filter((line) => line.kind !== "one_time");

  const finish = async (work: Promise<boolean>) => {
    if (await work) onClose();
  };

  const footer =
    panel === "date" ? (
      <BigButton busy={busy} disabled={!day || day === box.deliveryDate} onClick={() => day && finish(onMoveDay(day))}>
        Save
      </BigButton>
    ) : panel === "location" ? (
      <BigButton
        busy={busy}
        disabled={!canSaveLocation}
        onClick={() =>
          finish(
            onChangeLocation(
              method === "pickup"
                ? { method: "pickup", pickupStationId: stationId as string, scope }
                : { method: "address", address: address!.address, lat: address!.lat, lng: address!.lng, speed: method, scope: thisOrderOnly ? "box" : scope },
            ),
          )
        }
      >
        Save
      </BigButton>
    ) : panel === "remove" ? (
      <BigButton onClick={onClose}>Done</BigButton>
    ) : undefined;

  return (
    <BottomSheet open={open} onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      {panel === "menu" && (
        <div>
          <MenuRow icon={<Trash className="h-[17px] w-[17px]" strokeWidth={1.9} />} label="Remove an item" onClick={() => setPanel("remove")} />
          <MenuRow
            icon={<MapPin className="h-[17px] w-[17px]" strokeWidth={1.9} />}
            label="Change delivery method"
            sub={deliveryNow(box)}
            onClick={() => setPanel("location")}
          />
          <MenuRow icon={<Calendar className="h-[17px] w-[17px]" strokeWidth={1.9} />} label="Change delivery date" sub={formatDay(box.deliveryDate)} onClick={() => setPanel("date")} />
        </div>
      )}

      {panel === "remove" && (
        <div>
          {box.items.map((line) => (
            <div key={line.id} className="flex items-center gap-3 border-b border-[#EEE8E1] py-3">
              <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]"><Thumb src={line.imageUrl} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-[18px]">{brandedName(line.brand, line.productName)}</span>
                <span className="block text-[12px] leading-4 text-[#6B5F55]">{[line.variantLabel, `×${line.quantity}`, line.kind === "one_time" ? "extra" : null].filter(Boolean).join(" · ")}</span>
              </span>
              {line.subscriptionId && (
                <button
                  type="button"
                  aria-label={`Remove ${line.productName}`}
                  disabled={busy || subscriptionLines.length <= 1}
                  onClick={() => line.subscriptionId && onLeaveOut(line.subscriptionId)}
                  className="h-10 rounded-[20px] border-[1.5px] border-shop-brown px-4 text-[13px] font-semibold text-shop-brown disabled:opacity-40"
                >
                  Remove
                </button>
              )}
              {!line.subscriptionId && line.kind === "one_time" && (
                <button
                  type="button"
                  aria-label={`Remove ${line.productName} (extra)`}
                  disabled={busy}
                  onClick={() => onRemoveExtra(line.id)}
                  className="h-10 rounded-[20px] border-[1.5px] border-shop-brown px-4 text-[13px] font-semibold text-shop-brown disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {subscriptionLines.length <= 1 && <p className="mt-3 text-[12.5px] leading-[18px] text-[#6B5F55]">An order needs at least one item. To skip it instead, tap Skip.</p>}
          <p className="mt-3 text-[12.5px] leading-[18px] text-[#6B5F55]">A removed subscription item stays on your subscription and comes back in the next order.</p>
        </div>
      )}

      {panel === "date" && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button key={d.date} type="button" aria-pressed={day === d.date} onClick={() => setDay(d.date)} className={pill(day === d.date)}>
                {formatDay(d.date)}
              </button>
            ))}
          </div>
          <DateHint box={box} onChangeMethod={() => setPanel("location")} />
        </div>
      )}

      {panel === "location" && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {available.map((m) => (
              <button key={m} type="button" aria-pressed={method === m} onClick={() => setChoice(m)} className={pill(method === m)}>
                {pillText(m)}
              </button>
            ))}
          </div>
          {waitingForOptions && <p className="mt-2.5 text-[13px] leading-[18px] text-[#6B5F55]">Checking how we can deliver there…</p>}
          {noDelivery && <p className="mt-2.5 text-[13px] font-semibold leading-[18px] text-[#9A4A3A]">We do not deliver to that address yet. You can pick it up instead.</p>}

          {method !== "pickup" && (
            <div className="mt-4">
              {address && !addingAddress && (
                // Her address, with the way to change it right under it.
                <div className="flex w-full items-start gap-3 py-1">
                  <span className="mt-0.5">
                    <Radio on />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-5">{address.address}</span>
                    {address.address !== lastAddress?.address || address.address === box.delivery.address ? (
                      <span className="block text-[12.5px] leading-[17px] text-[#6B5F55]">{address.address === box.delivery.address ? "Where this order is going now" : "New address"}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setAddingAddress(true)}
                      className="-my-1.5 mt-0 inline-block py-1.5 text-[13px] font-semibold leading-[18px] text-shop-brown underline underline-offset-[3px]"
                    >
                      Change address
                    </button>
                  </span>
                </div>
              )}
              {(addingAddress || !address) && (
                <div className="mt-3">
                  <CheckoutAddressSection
                    selectedAddress={null}
                    onSelectAddress={(a, lat, lng) => {
                      setAddress({ address: a, lat, lng });
                      setAddingAddress(false);
                    }}
                    onChangeAddress={() => setAddingAddress(true)}
                    headerAction={
                      address ? (
                        // Changed her mind: back to the address she had, nothing changed.
                        <button
                          type="button"
                          onClick={() => setAddingAddress(false)}
                          className="-my-1.5 py-1.5 text-[13px] font-semibold leading-[18px] text-shop-brown underline underline-offset-[3px]"
                        >
                          Cancel
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              )}
            </div>
          )}

          {method === "pickup" && (
            <div className="mt-4">
              {stations.filter((s) => s.isActive).map((s) => {
                const usable = (s.subscriptionDays?.length ?? 0) > 0;
                return (
                  <button key={s.id} type="button" disabled={!usable} onClick={() => setStationId(s.id)} className="flex min-h-[68px] w-full items-center gap-3 border-b border-[#EEE8E1] py-2 text-left disabled:opacity-50">
                    <Radio on={stationId === s.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-5">{s.name}</span>
                      <span className="block text-[12.5px] leading-[17px] text-[#6B5F55]">{s.address}</span>
                      <span className="block text-[12.5px] font-semibold leading-[17px] text-[#46564A]">{usable ? `${s.dayOfWeek} · ${s.hours}` : "Not taking subscription orders yet"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {thisOrderOnly ? (
            <p className="mt-5 text-[13px] leading-[18px] text-[#46564A]">Instant Delivery is for this order only. Your next order goes back to Community Delivery.</p>
          ) : (
            <fieldset className="mt-5">
              <legend className="mb-1 text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-[#6B5F55]">Use this place for</legend>
              {(
                [
                  ["box", "This order only"],
                  ["future", "This and my future orders"],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" role="radio" aria-checked={scope === value} onClick={() => setScope(value)} className="flex h-12 w-full items-center gap-3 text-left text-[14.5px] font-semibold">
                  <Radio on={scope === value} />
                  {label}
                </button>
              ))}
            </fieldset>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
