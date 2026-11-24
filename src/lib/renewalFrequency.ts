import type { RenewalFrequency } from '@/lib/subscriptionBoxes';

/**
 * How often an item renews, as the picker and the tab say it. The same words as the API's
 * describeFrequency (api/src/app/subscription-boxes/renewal-frequency.ts): "Every 3 weeks",
 * "On the 25th of every month", "The 2nd Tuesday of every month".
 */

/** ISO weekday 1 (Monday) to 7 (Sunday). */
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** The picker's "which one in the month": 1st to 4th, or the last. */
export const NTH_CHOICES: Array<{ value: 1 | 2 | 3 | 4 | -1; label: string }> = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: -1, label: 'Last' },
];

export const MAX_WEEKS = 12;

export function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/**
 * The same words in the middle of a sentence: "every 3 weeks", "on the 25th of every month". Only the first letter
 * changes, so "The 2nd Tuesday of every month" becomes "the 2nd Tuesday of every month", with its capital Tuesday.
 */
export function describeFrequencyInSentence(f: RenewalFrequency): string {
  const text = describeFrequency(f);
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function describeFrequency(f: RenewalFrequency): string {
  switch (f.kind) {
    case 'weeks':
      return f.every === 1 ? 'Every week' : `Every ${f.every} weeks`;
    case 'month_date':
      return `On the ${ordinal(f.day)} of every month`;
    case 'month_weekday': {
      const nth = f.nth === -1 ? 'last' : ordinal(f.nth);
      return `The ${nth} ${WEEKDAY_LONG[f.weekday - 1]} of every month`;
    }
  }
}

/** A sensible starting point when she switches from one kind to another. */
export function switchKind(current: RenewalFrequency, kind: RenewalFrequency['kind']): RenewalFrequency {
  if (current.kind === kind) return current;
  switch (kind) {
    case 'weeks':
      return { kind: 'weeks', every: 4 };
    case 'month_date':
      return { kind: 'month_date', day: 25 };
    case 'month_weekday':
      return { kind: 'month_weekday', nth: 1, weekday: 1 };
  }
}

/** Same frequency, ignoring how the object was built. */
export function sameFrequency(a: RenewalFrequency, b: RenewalFrequency): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The number of weeks the old reminders use for a frequency: the weeks themselves, or 4 for anything monthly.
 * The API always stores this next to the new frequency, so turning the new experience off leaves every item
 * with a sensible old-style cycle.
 */
export function legacyWeeks(f: RenewalFrequency): number {
  return f.kind === 'weeks' ? f.every : 4;
}
