import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDeliveryOptions, type DeliveryChoice, type DeliveryOptions, type DeliveryQuoteStaleError } from '@/lib/api';
import { orderDeliveryFields, selectedDelivery } from '@/lib/delivery-choice';

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Asks the server what delivery costs at an address, and holds which option the buyer chose.
 *
 * The choice belongs to the address it was made for: pick another address and it is gone,
 * with no effect needed to clear it. Options are kept for ten minutes (a quote lives for
 * fifteen); if one has gone stale by the time the order is placed, the server answers with
 * fresh options and `applyStale` swaps them in, so the buyer sees the new price and day.
 */
export function useDeliveryOptions(token: string | undefined, coords: Coordinates | null) {
  const queryClient = useQueryClient();
  const coordsKey = coords ? `${coords.lat},${coords.lng}` : null;
  const queryKey = ['delivery-options', coordsKey] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDeliveryOptions(token as string, (coords as Coordinates).lat, (coords as Coordinates).lng),
    enabled: !!token && !!coords,
    staleTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [choice, setChoiceState] = useState<DeliveryChoice | null>(null);
  // A pick belongs to the address it was made for. When the address changes it is dropped
  // right here, while rendering (React's way to reset state when an input changes), so it
  // cannot linger and come back if the buyer returns to an earlier address.
  const [choiceKey, setChoiceKey] = useState(coordsKey);
  if (choiceKey !== coordsKey) {
    setChoiceKey(coordsKey);
    setChoiceState(null);
  }
  const setChoice = setChoiceState;

  const options = query.data ?? null;

  /** The server refused the order because the quote is no longer true. Show what is true now. */
  const applyStale = useCallback(
    (err: DeliveryQuoteStaleError) => {
      if (err.options) queryClient.setQueryData(queryKey, err.options satisfies DeliveryOptions);
      else queryClient.invalidateQueries({ queryKey });
      setChoiceState(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, coordsKey],
  );

  return {
    options,
    isLoading: query.isFetching && !options,
    error: query.error as Error | null,
    refetch: query.refetch,
    choice,
    setChoice,
    /** The chosen option's fee and day, or null if nothing valid is chosen. */
    selected: selectedDelivery(options, choice),
    /** What an order request must carry to be priced by the quote. Null until a valid choice is made. */
    orderFields: orderDeliveryFields(options, choice),
    applyStale,
  };
}

export type DeliveryOptionsState = ReturnType<typeof useDeliveryOptions>;
