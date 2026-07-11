const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDate(value: string): boolean {
  return LOCAL_DATE_RE.test(value);
}

// Day-of-week (0=Sunday..6=Saturday) for a "YYYY-MM-DD" calendar date.
// Parsed as UTC so the result only depends on the date's own components,
// never on the server process's local timezone.
export function dayOfWeekIndex(localDate: string): number {
  return new Date(`${localDate}T00:00:00Z`).getUTCDay();
}

// Integer number of calendar days from `a` to `b` (positive if b is later).
export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / msPerDay);
}
