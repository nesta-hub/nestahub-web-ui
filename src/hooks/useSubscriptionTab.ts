import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { resetSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import { BOX_CODES, BoxApiError, subscriptionBoxesApi, type MyBoxes } from "@/lib/subscriptionBoxes";

/** Words to show for an answer the page can do nothing more about. */
function friendlyMessage(error: unknown): string {
  if (error instanceof BoxApiError) {
    if (error.code === BOX_CODES.totalChanged) return "The price has changed. Please check the new total.";
    if (error.code === BOX_CODES.paymentStarted || error.code === BOX_CODES.notEditable) return "This order can no longer be changed.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** A box is waiting on us to confirm a payment she says she made: check back until it is. */
export function hasPaymentInProgress(data: MyBoxes | undefined): boolean {
  return !!data?.boxes.some((b) => b.order?.status === "payment_made");
}

/**
 * The Subscription tab's data, and every change she can make to it.
 *
 * Each action runs, then re-reads the whole tab, so what she sees is always what the server
 * holds. A refusal becomes a plain message and a fresh read (the page she was looking at
 * has probably gone out of date); it never leaves her on a stale screen.
 */
export function useSubscriptionTab() {
  const { session, user } = useAuth();
  const accessToken = session?.access_token ?? null;
  const queryClient = useQueryClient();
  const key = ["subscription-tab", user?.id ?? "link"] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: () => subscriptionBoxesApi.mine(accessToken),
    staleTime: 15_000,
    retry: false,
    refetchInterval: (q) => (hasPaymentInProgress(q.state.data) ? 10_000 : false),
  });

  // The switch was turned off while she was looking: go back to the old page.
  const switchedOff = query.error instanceof BoxApiError && query.error.status === 404;
  useEffect(() => {
    if (switchedOff) resetSubscribeEnabled();
  }, [switchedOff]);

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: key }), [queryClient, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Run a change. Resolves true if it worked. `quiet` skips the error toast for callers that
   * show the error themselves (a form that keeps its own message).
   */
  const act = useCallback(
    async <T,>(change: () => Promise<T>, options: { quiet?: boolean } = {}): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> => {
      try {
        const value = await change();
        await refresh();
        return { ok: true, value };
      } catch (error) {
        if (!options.quiet) toast.error(friendlyMessage(error));
        await refresh();
        return { ok: false, error };
      }
    },
    [refresh],
  );

  return { ...query, accessToken, refresh, act, switchedOff };
}
