// Overview chart helpers. Pure; unit-tested in tests/overview.test.ts.

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: unknown): Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export type DayCount = { day: string; total: number };
export type Bucket = { start: string; end: string; total: number };

/**
 * 7 and 30 days: one bar per day. 90 days: one bar per week (weeks start on Monday,
 * as in the UK), so the chart stays readable on a phone.
 */
export function bucketCounts(days: DayCount[], range: Range): Bucket[] {
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  if (range !== 90) return sorted.map((d) => ({ start: d.day, end: d.day, total: d.total }));

  const buckets: Bucket[] = [];
  for (const d of sorted) {
    const date = new Date(`${d.day}T00:00:00Z`);
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const last = buckets[buckets.length - 1];
    if (last && last.start === key) {
      last.total += d.total;
      last.end = d.day;
    } else {
      buckets.push({ start: key, end: d.day, total: d.total });
    }
  }
  return buckets;
}
