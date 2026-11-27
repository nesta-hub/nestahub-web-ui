import type { CartItem } from '@/contexts/CartContext';
import { legacyWeeks } from '@/lib/renewalFrequency';

/**
 * A cart line as the create-order call wants it.
 *
 * `newStyle` is the Subscribe experience being on for her. Off, the line is exactly what it has always been
 * (`isAutoRenew` and `frequencyWeeks`). On, a subscription line also says how often it renews in the new way, and for
 * a weekly one the day she wants the first renewal. A subscription line that did not come from the new card (it was
 * switched on in the cart) is sent as "every N weeks", so every new subscription from then on counts from its delivery.
 */
export function toOrderItem(item: CartItem, newStyle: boolean) {
  const frequency = item.isAutoRenew ? (item.renewalFrequency ?? { kind: 'weeks' as const, every: item.frequencyWeeks ?? 4 }) : null;
  return {
    variantId: item.variantId,
    quantity: item.quantity,
    isAutoRenew: item.isAutoRenew ?? false,
    // One source for the old column: the choice itself when there is one, else what the cart holds.
    frequencyWeeks: item.isAutoRenew ? (item.renewalFrequency ? legacyWeeks(item.renewalFrequency) : (item.frequencyWeeks ?? null)) : null,
    subscriptionId: item.subscriptionId ?? undefined,
    ...(newStyle && frequency
      ? {
          renewalFrequency: frequency,
          ...(frequency.kind === 'weeks' && item.firstRenewalDate ? { firstRenewalDate: item.firstRenewalDate } : {}),
        }
      : {}),
  };
}
