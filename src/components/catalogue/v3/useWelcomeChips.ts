import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getMyOrders } from "@/lib/api";
import { lagosDay, pickWelcomeChips, type WelcomeChip } from "./welcomeChips";

/**
 * The chips for the welcome card: the cart and the customer's orders, boiled down by
 * `pickWelcomeChips`. The orders are the same ones the Account page lists (same query key),
 * so opening Account afterwards costs nothing. If they can't be loaded the card just
 * has fewer chips.
 */
export function useWelcomeChips(): WelcomeChip[] {
  const { session } = useAuth();
  const { itemCount } = useCart();
  const token = session?.access_token;

  const { data } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(token!),
    enabled: !!token,
    staleTime: 30_000,
  });
  const orders = data?.orders;

  return useMemo(
    () => pickWelcomeChips({ orders: orders ?? [], cartCount: itemCount, today: lagosDay(new Date()) }),
    [orders, itemCount],
  );
}
