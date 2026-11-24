import type { UnplannedReason } from "@/lib/subscriptionBoxes";

/** Why an item that is due soon is not in an order, in words for her. */
export function problemText(reason: UnplannedReason): string {
  switch (reason) {
    case "no_location":
      return "Add a delivery address to get this one.";
    case "station_without_weekday":
    case "station_missing":
      return "Your pick-up station is not available for subscriptions. Choose a delivery address or another station.";
    case "outside_delivery_area":
      return "We do not deliver to your address yet.";
    case "variant_unavailable":
      return "This one is not available right now. We will let you know.";
    case "no_instant_days":
    case "no_open_day":
      return "We could not find a delivery day yet. Please check back soon.";
  }
}
