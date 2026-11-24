import type { DeliveryOptions } from "@/lib/subscriptionBoxes";

/** The ways an order can reach her. */
export type Method = "community" | "instant" | "pickup";

export const METHOD_LABEL: Record<Method, string> = {
  community: "Community Delivery",
  instant: "Instant Delivery",
  pickup: "Pick-up",
};

/**
 * Which methods to offer, in this order: Community Delivery (only if the address is in a community area), Instant
 * Delivery, Pick-up.
 *
 * `options` is what the server says about the address. Until it has answered (or if it cannot), we offer what her order
 * has now: Community Delivery only when the address is the one a community order already goes to, so the list does not
 * jump around while it loads. Instant and Pick-up are always on the list until we know better.
 */
export function availableMethods(input: { options: DeliveryOptions | undefined; addressIsCurrentCommunity: boolean }): Method[] {
  const { options } = input;
  if (options) {
    return [options.community ? "community" : null, options.instant ? "instant" : null, "pickup"].filter(Boolean) as Method[];
  }
  return [input.addressIsCurrentCommunity ? "community" : null, "instant", "pickup"].filter(Boolean) as Method[];
}

/** What she has picked, if it is still on offer; otherwise the first method that is (Community, else Instant, else Pick-up). */
export function chosenMethod(choice: Method | null, available: Method[]): Method {
  return choice && available.includes(choice) ? choice : available[0];
}

/** The server found no way to deliver to this address (neither Community Delivery nor Instant): only Pick-up is left. */
export function nothingDeliversThere(options: DeliveryOptions | undefined): boolean {
  return !!options && !options.community && !options.instant;
}

/** Instant inside a community area is for this order only: her saved default has no place to say "Instant". */
export function instantIsForThisOrderOnly(method: Method, available: Method[]): boolean {
  return method === "instant" && available.includes("community");
}
