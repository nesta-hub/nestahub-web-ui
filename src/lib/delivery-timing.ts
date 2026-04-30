/**
 * Delivery Timing Calculation
 *
 * Business Rules:
 * - Monday-Saturday, 12am-4pm: Same day delivery
 * - Monday-Saturday, after 4pm: Next day delivery
 * - Saturday after 4pm: Monday delivery (skip Sunday)
 * - All day Sunday: Monday delivery (no Sunday deliveries)
 */

export type DeliverySpeed = 'sameday' | 'nextday';

export interface DeliveryTiming {
  speed: DeliverySpeed;
  displayLabel: string;
  deliveryDate: string; // e.g., "Thu, 28 Apr 2026"
}

/**
 * Formats a date object to "Thu, 28 Apr 2026" format
 */
function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates delivery date by adding days, skipping Sundays
 */
function addDeliveryDays(baseDate: Date, daysToAdd: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Determines delivery timing based on current server time
 */
export function calculateDeliveryTiming(): DeliveryTiming {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const hour = now.getHours(); // 0-23

  // Sunday: Always next day (Monday)
  if (day === 0) {
    const deliveryDate = addDeliveryDays(now, 1); // Tomorrow is Monday
    return {
      speed: 'nextday',
      displayLabel: 'Next day delivery',
      deliveryDate: formatDeliveryDate(deliveryDate),
    };
  }

  // Saturday after 4pm: Monday delivery (skip Sunday)
  if (day === 6 && hour >= 16) {
    const deliveryDate = addDeliveryDays(now, 2); // Skip Sunday, deliver Monday
    return {
      speed: 'nextday',
      displayLabel: 'Next day delivery',
      deliveryDate: formatDeliveryDate(deliveryDate),
    };
  }

  // Monday-Saturday before 4pm: Same day delivery
  if (hour < 16) {
    const deliveryDate = new Date(now); // Today
    return {
      speed: 'sameday',
      displayLabel: 'Same day delivery',
      deliveryDate: formatDeliveryDate(deliveryDate),
    };
  }

  // Monday-Friday after 4pm: Next day delivery
  const deliveryDate = addDeliveryDays(now, 1); // Tomorrow
  return {
    speed: 'nextday',
    displayLabel: 'Next day delivery',
    deliveryDate: formatDeliveryDate(deliveryDate),
  };
}
