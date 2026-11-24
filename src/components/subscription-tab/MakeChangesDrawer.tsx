import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Trash } from "lucide-react";
import { formatPrice, getPickupStations } from "@/lib/api";
import { CheckoutAddressSection } from "@/components/checkout/CheckoutAddressSection";
import { formatDay, type Box, type DeliveryOptions, type LocationInput } from "@/lib/subscriptionBoxes";
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
export function MakeChangesDrawer({ box, open, startOn = "menu", busy, onClose, onLeaveOut, onRemoveExtra, onMoveDay, onChangeLocation, loadDeliveryOptions }: Props) {
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
    setAddress(box.delivery.address && box.delivery.lat !== null && box.delivery.lng !== null ? { address: box.delivery.address, lat: box.delivery.lat, lng: box.delivery.lng } : null);
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
  const fee = method === "community" ? options?.community?.feeKobo : method === "instant" ? options?.instant?.feeKobo : 0;
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
          <MenuRow icon={<MapPin className="h-[17px] w-[17px]" strokeWidth={1.9} />} label="Change delivery method" detail={box.delivery.type ? METHOD_LABEL[box.delivery.type] : "Not set"} onClick={() => setPanel("location")} />
          <MenuRow icon={<Calendar className="h-[17px] w-[17px]" strokeWidth={1.9} />} label="Change delivery date" detail={formatDay(box.deliveryDate)} onClick={() => setPanel("date")} />
        </div>
      )}

      {panel === "remove" && (
        <div>
          {box.items.map((line) => (
            <div key={line.id} className="flex items-center gap-3 border-b border-[#EEE8E1] py-3">
              <span className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] bg-[#EFEAE4]"><Thumb src={line.imageUrl} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold leading-[18px]">{line.productName}</span>
                <span className="block text-[12px] leading-4 text-[#6B5F55]">{[line.variantLabel, `×${line.quantity}`, line.kind === "one_time" ? "extra" : null].filter(Boolean).join(" · ")}</span>
              </span>
              {line.subscriptionId && (
                <button
                  type="button"
                  aria-label={`Remove ${line.productName}`}
                  disabled={busy || subscriptionLines.length <= 1}
                  onClick={() => line.subscriptionId && onLeaveOut(line.subscriptionId)}
                  className="h-10 rounded-[20px] border-[1.5px] border-shop-brown px-4 text-[13px] font-extrabold text-shop-brown disabled:opacity-40"
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
                  className="h-10 rounded-[20px] border-[1.5px] border-shop-brown px-4 text-[13px] font-extrabold text-shop-brown disabled:opacity-40"
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
          <p className="mt-3.5 text-[12.5px] leading-[18px] text-[#6B5F55]">These are the next days we deliver to you. Pick one and save.</p>
        </div>
      )}

      {panel === "location" && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {available.map((m) => (
              <button key={m} type="button" aria-pressed={method === m} onClick={() => setChoice(m)} className={pill(method === m)}>
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
          {waitingForOptions && <p className="mt-2.5 text-[13px] leading-[18px] text-[#6B5F55]">Checking how we can deliver there…</p>}
          {method !== "pickup" && !waitingForOptions && fee !== undefined && fee !== null && (
            <p className="mt-2.5 text-[13px] font-semibold leading-[18px] text-[#46564A]">
              {METHOD_LABEL[method]} · {fee === 0 ? "Free" : formatPrice(fee)}
            </p>
          )}
          {noDelivery && <p className="mt-2.5 text-[13px] font-semibold leading-[18px] text-[#9A4A3A]">We do not deliver to that address yet. You can pick it up instead.</p>}

          {method !== "pickup" && (
            <div className="mt-1.5">
              {address && !addingAddress && (
                <button type="button" onClick={() => setAddingAddress(false)} className="flex min-h-[60px] w-full items-center gap-3 border-b border-[#EEE8E1] py-2 text-left">
                  <Radio on />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-5">{address.address}</span>
                    <span className="block text-[12.5px] leading-[17px] text-[#6B5F55]">{address.address === box.delivery.address ? "Where this order is going now" : "New address"}</span>
                  </span>
                </button>
              )}
              {addingAddress || !address ? (
                <div className="mt-3">
                  <CheckoutAddressSection
                    selectedAddress={null}
                    onSelectAddress={(a, lat, lng) => {
                      setAddress({ address: a, lat, lng });
                      setAddingAddress(false);
                    }}
                    onChangeAddress={() => setAddingAddress(true)}
                  />
                </div>
              ) : (
                <button type="button" onClick={() => setAddingAddress(true)} className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-[#CFC6BC] text-[14px] font-extrabold text-shop-brown">
                  Change address
                </button>
              )}
            </div>
          )}

          {method === "pickup" && (
            <div className="mt-1.5">
              {stations.filter((s) => s.isActive).map((s) => {
                const usable = (s.subscriptionDays?.length ?? 0) > 0;
                return (
                  <button key={s.id} type="button" disabled={!usable} onClick={() => setStationId(s.id)} className="flex min-h-[68px] w-full items-center gap-3 border-b border-[#EEE8E1] py-2 text-left disabled:opacity-50">
                    <Radio on={stationId === s.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold leading-5">{s.name}</span>
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
