import { describe, expect, it } from 'vitest';
import type { DeliveryOptions } from '@/lib/api';
import {
  describeInstantTiming,
  describeOrderDelivery,
  describeSelectedDelivery,
  formatDeliveryDay,
  formatDeliveryDayShort,
  formatEta,
  orderDeliveryFields,
  selectedDelivery,
  withDate,
} from './delivery-choice';

const options = (over: Partial<DeliveryOptions> = {}): DeliveryOptions => ({
  lat: 6.56,
  lng: 3.39,
  instant: { available: true, feeKobo: 230_000, roadKm: 10.278, source: 'approved', date: '2026-10-21', dateLabel: 'Today', etaMinutes: 35 },
  community: {
    status: 'available',
    zoneId: 'z1',
    name: 'Gbagada',
    feeKobo: 50_000,
    date: '2026-10-24',
    dateLabel: 'Sat 24 Oct',
    daysLabel: 'Wed & Sat',
  },
  quote: 'signed.quote',
  expiresAt: '2026-10-21T11:15:00.000Z',
  ...over,
});

describe('selectedDelivery', () => {
  it('reads the fee and day of the chosen option from the server\'s answer', () => {
    expect(selectedDelivery(options(), 'instant')).toEqual({
      option: 'instant',
      feeKobo: 230_000,
      date: '2026-10-21',
      dateLabel: 'Today',
      zoneName: null,
    });
    expect(selectedDelivery(options(), 'community')).toEqual({
      option: 'community',
      feeKobo: 50_000,
      date: '2026-10-24',
      dateLabel: 'Sat 24 Oct',
      zoneName: 'Gbagada',
    });
  });

  it('is nothing until something is chosen', () => {
    expect(selectedDelivery(options(), null)).toBeNull();
    expect(selectedDelivery(null, 'instant')).toBeNull();
    expect(selectedDelivery(undefined, 'instant')).toBeNull();
  });

  it('never selects the "coming soon" card, however it is asked for', () => {
    const o = options({ community: { status: 'coming_soon', feeKobo: 100_000 } });

    expect(selectedDelivery(o, 'community')).toBeNull();
    expect(selectedDelivery(o, 'instant')).not.toBeNull();
  });

  it('is nothing when the chosen option is no longer on offer', () => {
    const noInstant = options({ instant: { available: false, reason: 'beyond_range' } });

    expect(selectedDelivery(noInstant, 'instant')).toBeNull();
    expect(selectedDelivery(options({ community: null }), 'community')).toBeNull();
  });

  it('is nothing without a quote, because the buyer would then be charged something else', () => {
    expect(selectedDelivery(options({ quote: null }), 'instant')).toBeNull();
  });
});

describe('orderDeliveryFields', () => {
  it('sends the quote, the choice and the exact coordinates the quote was issued for', () => {
    expect(orderDeliveryFields(options(), 'community')).toEqual({
      deliveryQuote: 'signed.quote',
      deliveryOption: 'community',
      deliveryLat: 6.56,
      deliveryLng: 3.39,
    });
  });

  it('sends nothing unless a valid choice is made', () => {
    expect(orderDeliveryFields(options(), null)).toBeNull();
    expect(orderDeliveryFields(options({ community: { status: 'coming_soon', feeKobo: 100_000 } }), 'community')).toBeNull();
    expect(orderDeliveryFields(options({ quote: null }), 'instant')).toBeNull();
  });
});

describe('describeSelectedDelivery', () => {
  it('names the way and the day', () => {
    expect(describeSelectedDelivery(selectedDelivery(options(), 'instant')!)).toBe('Instant · Today');
    expect(describeSelectedDelivery(selectedDelivery(options(), 'community')!)).toBe('Community Delivery · Gbagada · Sat 24 Oct');
  });
});

describe('formatDeliveryDay', () => {
  it('names the weekday, day, month and year', () => {
    expect(formatDeliveryDay('2026-10-24')).toBe('Sat 24 Oct 2026');
    expect(formatDeliveryDay('2027-01-01')).toBe('Fri 1 Jan 2027');
  });

  it('is the same day in every time zone (a plain Date parse would slip a day west of Greenwich)', () => {
    const original = process.env.TZ;
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = tz;
        expect(formatDeliveryDay('2026-10-24')).toBe('Sat 24 Oct 2026');
      }
    } finally {
      process.env.TZ = original;
    }
  });

  it.each(['', 'tomorrow', '2026-02-31', '24/10/2026', '2026-13-01'])('is null for %p', (bad) => {
    expect(formatDeliveryDay(bad)).toBeNull();
  });
});

describe('describeOrderDelivery: what the buyer is told about an order that exists', () => {
  it('Community Delivery: the area, the day and the fee', () => {
    expect(
      describeOrderDelivery({ deliveryType: 'community', deliveryZoneName: 'Gbagada', scheduledDeliveryDate: '2026-10-24', deliveryFee: 50_000 }),
    ).toBe('Community Delivery · Gbagada · Sat 24 Oct 2026 · ₦500');
  });

  it('Instant: the day and the fee', () => {
    expect(
      describeOrderDelivery({ deliveryType: 'instant', scheduledDeliveryDate: '2026-10-21', deliveryFee: 230_000 }),
    ).toBe('Instant · Wed 21 Oct 2026 · ₦2,300');
  });

  it('a free Community Delivery shows ₦0 rather than hiding the fee', () => {
    expect(describeOrderDelivery({ deliveryType: 'community', deliveryZoneName: 'Gbagada', scheduledDeliveryDate: '2026-10-24', deliveryFee: 0 })).toContain('₦0');
  });

  it('leaves out what is missing, never printing "null" or "undefined"', () => {
    expect(describeOrderDelivery({ deliveryType: 'instant', scheduledDeliveryDate: null, deliveryFee: null })).toBe('Instant');
    expect(describeOrderDelivery({ deliveryType: 'community', deliveryZoneName: null, scheduledDeliveryDate: '2026-10-24' })).toBe('Community Delivery · Sat 24 Oct 2026');
  });

  it('says nothing for pickup and for orders placed before delivery quotes existed', () => {
    expect(describeOrderDelivery({ deliveryType: null, deliveryFee: null })).toBeNull();
    expect(describeOrderDelivery({ deliveryFee: 200_000 })).toBeNull();
    expect(describeOrderDelivery(null)).toBeNull();
    expect(describeOrderDelivery(undefined)).toBeNull();
  });
});

describe('how long Instant takes', () => {
  it.each([
    [20, 'In about 20 mins'],
    [35, 'In about 35 mins'],
    [55, 'In about 55 mins'],
    [60, 'In about 1 hr'],
    [65, 'In about 1 hr 5 mins'],
    [105, 'In about 1 hr 45 mins'],
    [120, 'In about 2 hr'],
  ])('%s minutes reads "%s"', (minutes, text) => {
    expect(formatEta(minutes)).toBe(text);
  });

  it('replaces the day when there is an estimate, and is the day when there is none', () => {
    expect(describeInstantTiming('Today', 35)).toBe('In about 35 mins');
    expect(describeInstantTiming('Today', null)).toBe('Today');
    expect(describeInstantTiming('Tomorrow', undefined)).toBe('Tomorrow');
  });
});

describe('showing the date beside a relative day', () => {
  it('writes a date without the year', () => {
    expect(formatDeliveryDayShort('2026-10-21')).toBe('Wed 21 Oct');
    expect(formatDeliveryDayShort('2026-12-31')).toBe('Thu 31 Dec');
    expect(formatDeliveryDayShort('not a date')).toBeNull();
    expect(formatDeliveryDayShort('2026-02-31')).toBeNull();
  });

  it('adds it to Today and Tomorrow', () => {
    expect(withDate('Today', '2026-10-21')).toBe('Today · Wed 21 Oct');
    expect(withDate('Tomorrow', '2026-10-22')).toBe('Tomorrow · Thu 22 Oct');
  });

  it('leaves a label that already is a date alone', () => {
    expect(withDate('Sat 24 Oct', '2026-10-24')).toBe('Sat 24 Oct');
  });

  it('leaves the label alone when the date cannot be read', () => {
    expect(withDate('Today', 'garbage')).toBe('Today');
  });

  it('is what Instant shows once chosen, unless it has a time estimate', () => {
    expect(describeInstantTiming('Tomorrow', null, '2026-10-22')).toBe('Tomorrow · Thu 22 Oct');
    expect(describeInstantTiming('Today', 40, '2026-10-21')).toBe('In about 40 mins');
    expect(describeInstantTiming('Tomorrow', null)).toBe('Tomorrow'); // the card, which has no room for the date
  });
});
