import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { mapOrdersToGiftingHistory } from "@/components/gifting/giftingHistory";

/**
 * Gift cards and bundles the signed-in user has sent.
 *
 * Guest orders never appear here — a guest has no account to list them
 * against. They surface only after the guest signs in and their order is
 * claimed, which `AuthContext` does automatically.
 */
export function useGiftingHistory() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ["gifting-history", session?.user?.id],
    enabled: !!token,
    queryFn: async () => {
      const { orders } = await getMyOrders(token!);
      return mapOrdersToGiftingHistory(orders);
    },
  });
}
