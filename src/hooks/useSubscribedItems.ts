import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { formatDay, subscriptionBoxesApi, type SubscribedItem } from "@/lib/subscriptionBoxes";

/**
 * Her live subscriptions (active or paused), to look one up by type and size: `subscribedTo(variantId)`. Read from the
 * same data as the Subscription tab (and cached with it). Signed out, or while it loads, or if it fails: none.
 */
export function useSubscribedItems(enabled: boolean): (variantId: string | undefined) => SubscribedItem | null {
  const { session, user } = useAuth();
  const accessToken = session?.access_token ?? null;
  const { data } = useQuery({
    queryKey: ["subscription-tab", user?.id ?? "link"],
    queryFn: () => subscriptionBoxesApi.mine(accessToken),
    enabled: enabled && !!accessToken && !!user,
    staleTime: 15_000,
    retry: false,
  });
  return (variantId) => (enabled && variantId && data ? (data.items.find((item) => item.variantId === variantId) ?? null) : null);
}

/** "Quantity 2 · Every 3 weeks · Due: Tue 22 Dec", or "· Paused". */
export function subscribedLine(item: SubscribedItem): string {
  const when = item.status === "paused" ? "Paused" : item.nextDue ? `Due: ${formatDay(item.nextDue)}` : null;
  return [`Quantity ${item.quantity}`, item.frequencyLabel, when].filter(Boolean).join(" · ");
}
