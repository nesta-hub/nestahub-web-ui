import { describe, expect, it } from 'vitest';
import { monthFitNudge, nudgeText, suggestedFrequency, weeksItLasts } from './subscriptionFit';

const monthly = { kind: 'month_date', day: 25 } as const;
const weekdayMonthly = { kind: 'month_weekday', nth: 2, weekday: 2 } as const;

describe('weeksItLasts', () => {
  it('is one pack\'s weeks times how many packs', () => {
    expect(weeksItLasts(2, 1)).toBe(2);
    expect(weeksItLasts(2, 3)).toBe(6);
  });
  it('is never less than a week or more than the longest we offer', () => {
    expect(weeksItLasts(1, 1)).toBe(1);
    expect(weeksItLasts(8, 5)).toBe(12);
  });
  it.each([null, undefined, 0, -1])('is unknown when a pack\'s weeks are %s', (weeks) => {
    expect(weeksItLasts(weeks as never, 2)).toBeNull();
  });
  it.each([0, -1, NaN])('is unknown for a quantity of %s', (q) => {
    expect(weeksItLasts(2, q)).toBeNull();
  });
});

describe('suggestedFrequency', () => {
  it('is every N weeks, or nothing when we do not know', () => {
    expect(suggestedFrequency(3, 1)).toEqual({ kind: 'weeks', every: 3 });
    expect(suggestedFrequency(3, 2)).toEqual({ kind: 'weeks', every: 6 });
    expect(suggestedFrequency(null, 2)).toBeNull();
  });
});

describe('monthFitNudge', () => {
  it('warns that a monthly choice runs out when it lasts less than a month', () => {
    expect(monthFitNudge(monthly, 3, 1)).toEqual({ kind: 'runs_out', lastsWeeks: 3, suggest: { kind: 'weeks', every: 3 } });
    expect(monthFitNudge(weekdayMonthly, 1, 2)).toMatchObject({ kind: 'runs_out', lastsWeeks: 2 });
  });
  it('says there is leftover when it lasts more than a month', () => {
    expect(monthFitNudge(monthly, 4, 2)).toEqual({ kind: 'leftover', lastsWeeks: 8, suggest: { kind: 'weeks', every: 8 } });
  });
  it('says nothing when it lasts a month', () => {
    expect(monthFitNudge(monthly, 2, 2)).toBeNull();
    expect(monthFitNudge(monthly, 4, 1)).toBeNull();
  });
  it('says nothing about a weekly choice, or when we do not know how long it lasts', () => {
    expect(monthFitNudge({ kind: 'weeks', every: 2 }, 4, 3)).toBeNull();
    expect(monthFitNudge(monthly, null, 3)).toBeNull();
  });
});

describe('nudgeText', () => {
  it('speaks of one pack, or several, and of weeks', () => {
    expect(nudgeText({ kind: 'runs_out', lastsWeeks: 3, suggest: { kind: 'weeks', every: 3 } }, 1)).toBe(
      'This pack lasts about 3 weeks, so monthly may leave you short. Every 3 weeks keeps you covered.',
    );
    expect(nudgeText({ kind: 'leftover', lastsWeeks: 8, suggest: { kind: 'weeks', every: 8 } }, 2)).toBe(
      '2 packs last about 8 weeks, longer than a month. Every 8 weeks may suit you better.',
    );
    expect(nudgeText({ kind: 'runs_out', lastsWeeks: 1, suggest: { kind: 'weeks', every: 1 } }, 1)).toContain('about a week');
  });
});
