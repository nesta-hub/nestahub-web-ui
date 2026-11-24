/** Lagos is UTC+1 all year, with no clock changes. */
const LAGOS_OFFSET_MS = 3_600_000;

/** "YYYY-MM-DD" for a day to count, as an integer number of days since 1970. */
const toDays = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

/** Today's date in Lagos, "YYYY-MM-DD". */
export function lagosToday(now: Date = new Date()): string {
  return new Date(now.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** The calendar day `n` days after (or before, when negative) `ymd`. */
export function addDaysYmd(ymd: string, n: number): string {
  return new Date((toDays(ymd) + n) * 86_400_000).toISOString().slice(0, 10);
}

/** Is this a real calendar day written as "YYYY-MM-DD"? */
export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(toDays(value) * 86_400_000).toISOString().slice(0, 10) === value;
}
