import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveryQuoteStaleError, fetchDeliveryOptions, type DeliveryOptions } from '@/lib/api';
import { useDeliveryOptions } from './useDeliveryOptions';

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchDeliveryOptions: vi.fn(),
}));
const fetchMock = vi.mocked(fetchDeliveryOptions);

/**
 * The buyer's side of delivery options: ask the server once an address is chosen, hold which
 * option they picked, and never let a pick outlive the address it was made for or the answer
 * it was made against.
 */

const HOME = { lat: 6.56, lng: 3.39 };
const OFFICE = { lat: 6.5095, lng: 3.3711 };

const answer = (lat: number, lng: number, over: Partial<DeliveryOptions> = {}): DeliveryOptions => ({
  lat,
  lng,
  instant: { available: true, feeKobo: 230_000, roadKm: 10.3, source: 'approved', date: '2026-10-21', dateLabel: 'Today', etaMinutes: 35 },
  community: { status: 'available', zoneId: 'z1', name: 'Gbagada', feeKobo: 50_000, date: '2026-10-24', dateLabel: 'Sat 24 Oct', daysLabel: 'Wed & Sat' },
  quote: `quote-for-${lat}`,
  expiresAt: '2026-10-21T11:15:00.000Z',
  ...over,
});

const setup = (token: string | undefined, coords: { lat: number; lng: number } | null) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook((props: { token: string | undefined; coords: { lat: number; lng: number } | null }) => useDeliveryOptions(props.token, props.coords), {
    wrapper,
    initialProps: { token, coords },
  });
  return { ...hook, client };
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (_token, lat, lng) => answer(lat, lng));
});

describe('asking the server', () => {
  it('asks nothing until there is a signed-in buyer and an address', () => {
    setup(undefined, HOME);
    setup('token', null);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks once the address is chosen, with the buyer\'s token and the exact coordinates', async () => {
    const { result } = setup('token-1', HOME);

    await waitFor(() => expect(result.current.options).not.toBeNull());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('token-1', HOME.lat, HOME.lng);
  });

  it('reports a failure, so the page can offer a retry', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const { result } = setup('token-1', HOME);

    // The hook retries once (after a second) before giving up, so allow for that.
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 4000 });

    expect(result.current.options).toBeNull();
    expect(result.current.selected).toBeNull();
  });
});

describe('choosing', () => {
  it('nothing is chosen, and nothing can be sent, until the buyer picks', async () => {
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());

    expect(result.current.choice).toBeNull();
    expect(result.current.selected).toBeNull();
    expect(result.current.orderFields).toBeNull();
  });

  it('a pick gives the server\'s fee and day, and the fields the order must carry', async () => {
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());

    act(() => result.current.setChoice('community'));

    expect(result.current.selected).toMatchObject({ option: 'community', feeKobo: 50_000, dateLabel: 'Sat 24 Oct', zoneName: 'Gbagada' });
    expect(result.current.orderFields).toEqual({
      deliveryQuote: `quote-for-${HOME.lat}`,
      deliveryOption: 'community',
      deliveryLat: HOME.lat,
      deliveryLng: HOME.lng,
    });
  });

  it('can be changed, and cleared', async () => {
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());

    act(() => result.current.setChoice('instant'));
    expect(result.current.selected?.option).toBe('instant');
    act(() => result.current.setChoice('community'));
    expect(result.current.selected?.option).toBe('community');
    act(() => result.current.setChoice(null));
    expect(result.current.selected).toBeNull();
  });

  it('a pick belongs to its address: choosing another address starts again', async () => {
    const { result, rerender } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());
    act(() => result.current.setChoice('instant'));
    expect(result.current.selected).not.toBeNull();

    rerender({ token: 'token-1', coords: OFFICE });

    expect(result.current.choice).toBeNull();
    expect(result.current.selected).toBeNull();
    await waitFor(() => expect(result.current.options?.lat).toBe(OFFICE.lat));
    expect(result.current.orderFields).toBeNull(); // still nothing chosen for the new address
  });

  it('going back to the first address does not resurrect the old pick', async () => {
    const { result, rerender } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());
    act(() => result.current.setChoice('instant'));

    rerender({ token: 'token-1', coords: OFFICE });
    rerender({ token: 'token-1', coords: HOME });

    expect(result.current.selected).toBeNull();
  });

  it('a "coming soon" Community Delivery can never be selected', async () => {
    fetchMock.mockImplementation(async (_t, lat, lng) => answer(lat, lng, { community: { status: 'coming_soon', feeKobo: 100_000 } }));
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());

    act(() => result.current.setChoice('community'));

    expect(result.current.selected).toBeNull();
    expect(result.current.orderFields).toBeNull();
  });
});

describe('when the server says what they were shown is no longer true', () => {
  it('swaps in the fresh options and asks the buyer to choose again', async () => {
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());
    act(() => result.current.setChoice('instant'));
    expect(result.current.selected?.dateLabel).toBe('Today');

    const fresh = answer(HOME.lat, HOME.lng, {
      instant: { available: true, feeKobo: 230_000, roadKm: 10.3, source: 'approved', date: '2026-10-22', dateLabel: 'Tomorrow', etaMinutes: null },
      quote: 'fresh-quote',
    });
    act(() => result.current.applyStale(new DeliveryQuoteStaleError('The Instant delivery day has changed.', fresh)));

    expect(result.current.options?.quote).toBe('fresh-quote');
    expect(result.current.choice).toBeNull(); // they must confirm the new day
    act(() => result.current.setChoice('instant'));
    expect(result.current.selected?.dateLabel).toBe('Tomorrow');
    expect(result.current.orderFields?.deliveryQuote).toBe('fresh-quote');
  });

  it('refetches when the server sent no fresh options', async () => {
    const { result } = setup('token-1', HOME);
    await waitFor(() => expect(result.current.options).not.toBeNull());
    act(() => result.current.setChoice('instant'));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => result.current.applyStale(new DeliveryQuoteStaleError('Your delivery price has expired.', null)));

    expect(result.current.choice).toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
