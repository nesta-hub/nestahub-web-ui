import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeliveryOptions } from '@/lib/api';
import { DeliveryOptionsSection } from './DeliveryOptionsSection';

/**
 * What the buyer sees once they have entered an address. Every price and day on screen
 * comes from the server's answer; these tests feed it answers and check the screen.
 */

const instant = {
  available: true as const,
  feeKobo: 230_000,
  roadKm: 10.3,
  source: 'approved' as const,
  date: '2026-10-21',
  dateLabel: 'Today',
  etaMinutes: 35,
};
const community = {
  status: 'available' as const,
  zoneId: 'z1',
  name: 'Gbagada',
  feeKobo: 50_000,
  date: '2026-10-24',
  dateLabel: 'Sat 24 Oct',
  daysLabel: 'Wed & Sat',
};

const options = (over: Partial<DeliveryOptions> = {}): DeliveryOptions => ({
  lat: 6.56,
  lng: 3.39,
  instant,
  community,
  quote: 'signed.quote',
  expiresAt: '2026-10-21T11:15:00.000Z',
  ...over,
});

function show(over: Partial<React.ComponentProps<typeof DeliveryOptionsSection>> = {}) {
  const props = {
    options: options(),
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
    choice: null,
    onChoose: vi.fn(),
    ...over,
  };
  render(<DeliveryOptionsSection {...props} />);
  return props;
}

describe('inside a Community Delivery area', () => {
  it('offers Instant and Community Delivery side by side, each with its price and the server\'s day', () => {
    show();

    const instantCard = screen.getByRole('radio', { name: /Instant delivery/ });
    expect(instantCard).toHaveTextContent('In about 35 mins');
    expect(instantCard).toHaveTextContent('₦2,300');

    // Community Delivery shows the days the area is served, not one date: the closest is picked for the buyer.
    const communityCard = screen.getByRole('radio', { name: /Community Delivery/ });
    expect(communityCard).toHaveTextContent('Wed & Sat');
    expect(communityCard).not.toHaveTextContent('Sat 24 Oct');
    expect(communityCard).not.toHaveTextContent(/Today|Tomorrow/);
    expect(communityCard).toHaveTextContent('₦500');

    // Two columns, like Pickup and Deliver to Address.
    expect(screen.getByRole('radiogroup')).toHaveClass('grid', 'grid-cols-2');
  });

  it('does not show the area\'s name', () => {
    show();

    expect(screen.queryByText(/Gbagada/)).toBeNull();
  });

  it('gives Instant the server\'s time estimate instead of the day, when it arrives today', () => {
    show();

    const card = screen.getByRole('radio', { name: /Instant delivery/ });
    expect(card).toHaveTextContent('In about 35 mins');
    expect(card).not.toHaveTextContent('Today'); // the estimate takes the day's place
  });

  it('gives no time estimate when the server has none, or the day is not today', () => {
    show({ options: options({ instant: { ...instant, dateLabel: 'Tomorrow', etaMinutes: null } }) });

    const card = screen.getByRole('radio', { name: /Instant delivery/ });
    expect(card).toHaveTextContent('Tomorrow');
    expect(card).not.toHaveTextContent(/In about/);
  });

  it('falls back to the day when it is today but the server has no estimate (the old fee, Google down)', () => {
    show({ options: options({ instant: { ...instant, dateLabel: 'Today', etaMinutes: null } }) });

    expect(screen.getByRole('radio', { name: /Instant delivery/ })).toHaveTextContent('Today');
  });

  it('makes the day and time stand out in colour', () => {
    show();

    expect(screen.getByText('In about 35 mins')).toHaveClass('text-accent', 'font-semibold');
    expect(screen.getByText('Wed & Sat')).toHaveClass('text-accent', 'font-semibold');
  });

  it('uses the same heading size as the other steps', () => {
    show();

    expect(screen.getByRole('heading', { name: /Choose how you'd like it delivered/ })).toHaveClass('text-base');
  });

  it('builds both cards like Pickup and Deliver to Address, so they are the same height with the same shadow', () => {
    show();

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveClass('p-4', 'shadow-sm', 'hover:shadow-md'); // the Card's own shadow, lifted on hover
      expect(radio.querySelectorAll('p')).toHaveLength(3); // name, day, price: the same three lines in each
      expect(radio.querySelector('.w-10.h-10.rounded-full')).not.toBeNull(); // the same icon circle
    }
  });

  it('can be chosen from the keyboard', () => {
    const { onChoose } = show();

    fireEvent.keyDown(screen.getByRole('radio', { name: /Community Delivery/ }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('radio', { name: /Instant delivery/ }), { key: ' ' });

    expect(onChoose).toHaveBeenNthCalledWith(1, 'community');
    expect(onChoose).toHaveBeenNthCalledWith(2, 'instant');
  });

  it('pre-selects nothing', () => {
    show();

    for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('aria-checked', 'false');
  });

  it('reports the choice', () => {
    const { onChoose } = show();

    fireEvent.click(screen.getByRole('radio', { name: /Community Delivery/ }));
    expect(onChoose).toHaveBeenCalledWith('community');

    fireEvent.click(screen.getByRole('radio', { name: /Instant delivery/ }));
    expect(onChoose).toHaveBeenLastCalledWith('instant');
  });
});

describe('once one is chosen', () => {
  it('becomes a summary row with the other option gone', () => {
    show({ choice: 'instant' });

    expect(screen.getByRole('heading', { name: 'Delivery Option' })).toHaveClass('text-base');
    expect(screen.getByText('Instant delivery')).toBeInTheDocument();
    expect(screen.getByText('In about 35 mins')).toHaveClass('text-accent');
    expect(screen.getByText('₦2,300')).toHaveClass('font-semibold', 'text-foreground'); // the price is bold
    expect(screen.queryByText('Community Delivery')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('picks the closest Community Delivery for the buyer, and says which', () => {
    show({ choice: 'community' });

    expect(screen.getByText('Community Delivery')).toBeInTheDocument();
    expect(screen.getByText('Sat 24 Oct')).toHaveClass('text-accent');
    expect(screen.getByText('₦500')).toHaveClass('font-semibold', 'text-foreground');
    expect(screen.queryByText(/Delivers/)).toBeNull(); // two lines, like the other finished steps
    expect(screen.queryByText(/Gbagada/)).toBeNull();
    expect(screen.queryByText('Instant delivery')).toBeNull();
  });

  it('is the same two-line row as the Delivery Method and Delivery Address summaries: name, then the rest', () => {
    const { unmount } = render(
      <DeliveryOptionsSection options={options()} isLoading={false} error={null} onRetry={vi.fn()} choice="instant" onChoose={vi.fn()} />,
    );
    expect(screen.getByText('Instant delivery').closest('.p-3')?.textContent).toBe('Instant deliveryIn about 35 mins · ₦2,300Change');
    unmount();

    render(
      <DeliveryOptionsSection options={options()} isLoading={false} error={null} onRetry={vi.fn()} choice="community" onChoose={vi.fn()} />,
    );
    expect(screen.getByText('Community Delivery').closest('.p-3')?.textContent).toBe('Community DeliverySat 24 Oct · ₦500Change');
  });

  it('shows the date beside a relative day, so the buyer sees which day it actually is', () => {
    show({
      choice: 'community',
      options: options({ community: { ...community, date: '2026-10-21', dateLabel: 'Today' } }),
    });

    expect(screen.getByText('Today · Wed 21 Oct')).toHaveClass('text-accent', 'font-semibold');
  });

  it('Instant too, when it is for another day and so has no time estimate', () => {
    show({
      choice: 'instant',
      options: options({ instant: { ...instant, date: '2026-10-22', dateLabel: 'Tomorrow', etaMinutes: null } }),
    });

    expect(screen.getByText('Tomorrow · Thu 22 Oct')).toBeInTheDocument();
  });

  it('but not when Instant has a time estimate, which is all it needs', () => {
    show({ choice: 'instant' });

    expect(screen.getByText('In about 35 mins')).toBeInTheDocument();
    expect(screen.queryByText(/Wed 21 Oct/)).toBeNull();
  });

  it('"Change" takes the choice back so both can be chosen again', () => {
    const { onChoose } = show({ choice: 'instant' });

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect(onChoose).toHaveBeenCalledWith(null);
  });

  it('shows the cards again if the chosen option is no longer on offer', () => {
    show({ choice: 'community', options: options({ community: { status: 'coming_soon', feeKobo: 100_000 } }) });

    expect(screen.getByRole('radio', { name: /Instant delivery/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
  });
});

describe('outside every Community Delivery area', () => {
  it('shows Community Delivery greyed out as "coming soon" at its price, and it cannot be chosen', () => {
    const { onChoose } = show({ options: options({ community: { status: 'coming_soon', feeKobo: 100_000 } }) });

    const card = screen.getByText('Community Delivery').closest('[aria-disabled="true"]') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent('Coming soon');
    expect(card).toHaveTextContent('₦1,000');

    fireEvent.click(card);
    expect(onChoose).not.toHaveBeenCalled();
    // Only Instant is a choice.
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: /Instant delivery/ })).toBeInTheDocument();
  });

  it('Instant can still be chosen', () => {
    const { onChoose } = show({ options: options({ community: { status: 'coming_soon', feeKobo: 100_000 } }) });

    fireEvent.click(screen.getByRole('radio', { name: /Instant delivery/ }));

    expect(onChoose).toHaveBeenCalledWith('instant');
  });
});

describe('when Instant is not available', () => {
  it('says so, greyed out, while Community Delivery can still be chosen', () => {
    const { onChoose } = show({ options: options({ instant: { available: false, reason: 'beyond_range' } }) });

    const card = screen.getByText('Instant delivery').closest('[aria-disabled="true"]') as HTMLElement;
    expect(card).toHaveTextContent("doesn't reach this address");
    fireEvent.click(card);
    expect(onChoose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: /Community Delivery/ }));
    expect(onChoose).toHaveBeenCalledWith('community');
  });
});

describe('an address we cannot deliver to', () => {
  it('says so plainly and offers nothing to choose', () => {
    show({ options: options({ instant: { available: false, reason: 'outside_area' }, community: null, quote: null }) });

    expect(screen.getByRole('alert')).toHaveTextContent("We don't deliver to this address yet");
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByText(/Coming soon/)).toBeNull();
  });
});

describe('while the answer is on its way, and when it fails', () => {
  it('says it is checking, with nothing to choose yet', () => {
    show({ options: null, isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Checking delivery options');
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('lets the buyer try again if it fails', () => {
    const { onRetry } = show({ options: null, error: new Error('network') });

    expect(screen.getByRole('alert')).toHaveTextContent("couldn't work out delivery");
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalled();
  });
});
