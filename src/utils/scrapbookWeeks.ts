import type { Entry } from '@/api/hooks/entries';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart.getTime() + 6 * DAY_MS);
  return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

export function weekLabel(index: number): string {
  if (index === 0) return 'this week';
  if (index === 1) return 'last week';
  return `${index} weeks ago`;
}

export type Week = { index: number; label: string; range: string; entries: Entry[] };

export function bucketByWeek(entries: Entry[]): Week[] {
  const todayStart = startOfWeek(new Date());
  const buckets = new Map<number, Entry[]>();

  for (const entry of entries) {
    const entryDate = new Date(`${entry.localDate}T00:00:00`);
    const weekStart = startOfWeek(entryDate);
    const index = Math.round((todayStart.getTime() - weekStart.getTime()) / (7 * DAY_MS));
    if (!buckets.has(index)) buckets.set(index, []);
    buckets.get(index)!.push(entry);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, weekEntries]) => ({
      index,
      label: weekLabel(index),
      range: formatWeekRange(new Date(todayStart.getTime() - index * 7 * DAY_MS)),
      entries: weekEntries,
    }));
}

// Simple two-column masonry: alternate entries between columns so photo
// heights don't need to be known ahead of time.
export function splitColumns(entries: Entry[]): [Entry[], Entry[]] {
  const left: Entry[] = [];
  const right: Entry[] = [];
  entries.forEach((e, i) => (i % 2 === 0 ? left : right).push(e));
  return [left, right];
}
