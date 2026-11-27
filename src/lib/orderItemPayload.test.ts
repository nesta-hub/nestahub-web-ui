import { describe, expect, it } from 'vitest';
import type { CartItem } from '@/contexts/CartContext';
import { toOrderItem } from './orderItemPayload';

const line = (over: Partial<CartItem> = {}): CartItem => ({
  variantId: 'v1', productId: 'p1', productName: 'Diapers', brand: 'Kisskids', slug: 'diapers', typeId: '_default', typeName: '', quantity: 2, unitPrice: 500_000, ...over,
});

describe('toOrderItem', () => {
  it('a one-time line is the same in either mode', () => {
    const expected = { variantId: 'v1', quantity: 2, isAutoRenew: false, frequencyWeeks: null, subscriptionId: undefined };
    expect(toOrderItem(line(), false)).toEqual(expected);
    expect(toOrderItem(line(), true)).toEqual(expected);
  });

  it('with the experience off, a subscription line is exactly as it has always been: no new fields, even if the cart holds them', () => {
    const item = line({ isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: 'weeks', every: 3 }, firstRenewalDate: '2026-12-01' });
    const payload = toOrderItem(item, false);
    expect(payload).toEqual({ variantId: 'v1', quantity: 2, isAutoRenew: true, frequencyWeeks: 3, subscriptionId: undefined });
    expect(payload).not.toHaveProperty('renewalFrequency');
    expect(payload).not.toHaveProperty('firstRenewalDate');
  });

  it('with it on, a weekly line carries how often and the first day', () => {
    const item = line({ isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: 'weeks', every: 3 }, firstRenewalDate: '2026-12-01' });
    expect(toOrderItem(item, true)).toMatchObject({ isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: 'weeks', every: 3 }, firstRenewalDate: '2026-12-01' });
  });

  it('a monthly line sends its monthly choice and 4 weeks for the old column, and never a first day', () => {
    const item = line({ isAutoRenew: true, frequencyWeeks: 4, renewalFrequency: { kind: 'month_date', day: 25 }, firstRenewalDate: '2026-12-01' });
    const payload = toOrderItem(item, true);
    expect(payload).toMatchObject({ frequencyWeeks: 4, renewalFrequency: { kind: 'month_date', day: 25 } });
    expect(payload).not.toHaveProperty('firstRenewalDate');
  });

  it('the old column follows the choice even if the cart\'s own weeks disagree', () => {
    const item = line({ isAutoRenew: true, frequencyWeeks: 9, renewalFrequency: { kind: 'weeks', every: 5 } });
    expect(toOrderItem(item, false).frequencyWeeks).toBe(5);
    expect(toOrderItem(item, true).frequencyWeeks).toBe(5);
  });

  it('a line switched on in the cart (old way) is sent as every N weeks when the experience is on, so it counts from delivery', () => {
    const item = line({ isAutoRenew: true, frequencyWeeks: 2 });
    expect(toOrderItem(item, true)).toMatchObject({ frequencyWeeks: 2, renewalFrequency: { kind: 'weeks', every: 2 } });
    expect(toOrderItem(item, true)).not.toHaveProperty('firstRenewalDate');
    expect(toOrderItem(item, false)).not.toHaveProperty('renewalFrequency');
  });

  it('a one-time choice made on the new card sends nothing about renewal', () => {
    const payload = toOrderItem(line({ renewalFrequency: null, isAutoRenew: false }), true);
    expect(payload).not.toHaveProperty('renewalFrequency');
    expect(payload.isAutoRenew).toBe(false);
  });

  it('keeps the reorder id', () => {
    expect(toOrderItem(line({ subscriptionId: 'sub-1' }), true).subscriptionId).toBe('sub-1');
  });
});
