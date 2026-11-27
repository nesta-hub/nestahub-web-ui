import type { RenewalFrequency } from '@/lib/subscriptionBoxes';
import { MAX_WEEKS } from '@/lib/renewalFrequency';

/**
 * Does how often she chose fit how long what she buys lasts? A hint only: the server never refuses a choice
 * because of it, and nothing here blocks her.
 *
 * What we know is `recommendedFrequencyWeeks`: how many weeks ONE pack lasts. N packs last about N times that.
 */

/** How long this quantity lasts, in whole weeks (at least 1, at most the longest we offer). Null when we do not know. */
export function weeksItLasts(recommendedFrequencyWeeks: number | null | undefined, quantity: number): number | null {
  if (!recommendedFrequencyWeeks || recommendedFrequencyWeeks < 1) return null;
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return Math.min(MAX_WEEKS, Math.max(1, Math.round(recommendedFrequencyWeeks * quantity)));
}

/** The "every N weeks" we suggest to start with: how long it lasts, or null when we do not know. */
export function suggestedFrequency(recommendedFrequencyWeeks: number | null | undefined, quantity: number): RenewalFrequency | null {
  const weeks = weeksItLasts(recommendedFrequencyWeeks, quantity);
  return weeks === null ? null : { kind: 'weeks', every: weeks };
}

/** A month is four weeks. */
const MONTH_WEEKS = 4;

export type FitNudge =
  /** It will run out before the next one arrives. */
  | { kind: 'runs_out'; lastsWeeks: number; suggest: RenewalFrequency }
  /** She will have a lot left over when the next one arrives. */
  | { kind: 'leftover'; lastsWeeks: number; suggest: RenewalFrequency };

/**
 * A nudge for a monthly choice that does not match how long the pack lasts. Only monthly choices get one: a
 * weekly choice is already hers to set by the week.
 */
export function monthFitNudge(frequency: RenewalFrequency, recommendedFrequencyWeeks: number | null | undefined, quantity: number): FitNudge | null {
  if (frequency.kind === 'weeks') return null;
  const lasts = weeksItLasts(recommendedFrequencyWeeks, quantity);
  if (lasts === null || lasts === MONTH_WEEKS) return null;
  const suggest: RenewalFrequency = { kind: 'weeks', every: lasts };
  return lasts < MONTH_WEEKS ? { kind: 'runs_out', lastsWeeks: lasts, suggest } : { kind: 'leftover', lastsWeeks: lasts, suggest };
}

/** The sentence to show for a nudge. */
export function nudgeText(nudge: FitNudge, quantity: number): string {
  const packs = quantity === 1 ? 'This pack' : `${quantity} packs`;
  const verb = quantity === 1 ? 'lasts' : 'last';
  const lasts = nudge.lastsWeeks === 1 ? 'about a week' : `about ${nudge.lastsWeeks} weeks`;
  return nudge.kind === 'runs_out'
    ? `${packs} ${verb} ${lasts}, so monthly may leave you short. Every ${nudge.lastsWeeks} ${nudge.lastsWeeks === 1 ? 'week' : 'weeks'} keeps you covered.`
    : `${packs} ${verb} ${lasts}, longer than a month. Every ${nudge.lastsWeeks} weeks may suit you better.`;
}
