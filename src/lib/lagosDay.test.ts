import { describe, expect, it } from 'vitest';
import { addDaysYmd, isYmd, lagosToday } from './lagosDay';

describe('lagosToday', () => {
  it('is one hour ahead of UTC: 23:30 UTC is already tomorrow in Lagos', () => {
    expect(lagosToday(new Date('2026-11-15T22:59:00.000Z'))).toBe('2026-11-15');
    expect(lagosToday(new Date('2026-11-15T23:00:00.000Z'))).toBe('2026-11-16');
  });
});

describe('addDaysYmd', () => {
  it('counts across months and years, and backwards', () => {
    expect(addDaysYmd('2026-11-15', 1)).toBe('2026-11-16');
    expect(addDaysYmd('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysYmd('2027-03-01', -1)).toBe('2027-02-28');
    expect(addDaysYmd('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDaysYmd('2026-11-15', 182)).toBe('2027-05-16');
  });
});

describe('isYmd', () => {
  it.each(['2026-11-15', '2028-02-29'])('accepts %s', (v) => expect(isYmd(v)).toBe(true));
  it.each(['2026-02-31', '2026-13-01', '15/11/2026', '2026-1-5', '', 'soon'])('refuses %s', (v) => expect(isYmd(v)).toBe(false));
});
