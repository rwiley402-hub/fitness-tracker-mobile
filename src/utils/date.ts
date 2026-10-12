/**
 * Small, dependency-free date helpers. All functions work in the device's
 * local time zone, because workouts are stored as local date-times
 * ("2026-10-12T07:45:00", no offset).
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" key for the local calendar day of a date. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local date-time string without offset, e.g. "2026-10-12T07:45:00". */
export function toLocalISOString(date: Date): string {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Parses "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm[:ss]" as a local date.
 * Returns null for malformed or impossible dates (e.g. 2026-02-30).
 */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  const valid =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d) &&
    Number(hh) < 24 &&
    Number(mm) < 60 &&
    Number(ss) < 60;
  return valid ? date : null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds whole calendar days (DST-safe because it works on date components). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday 00:00 of the week containing `date` (ISO-8601 weeks start on Monday). */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7; // Mon=0 ... Sun=6
  return addDays(day, -offset);
}

/** Whole calendar days from `a` to `b` (positive if b is later). */
export function diffInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

/** "Oct 12" */
export function formatShortDate(date: Date): string {
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "Mon, Oct 12 · 07:45" */
export function formatDateTime(date: Date): string {
  return `${weekdayShort(date)}, ${formatShortDate(date)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Today", "Yesterday" or "Mon, Oct 12" relative to `now`. */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const diff = diffInDays(date, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${weekdayShort(date)}, ${formatShortDate(date)}`;
}
