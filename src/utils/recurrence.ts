import { AccountFrequency } from '../types';

/**
 * Returns the maximum days in a specific year and month (1-indexed month: 1=Jan, 12=Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Helper to clamp a day to valid month range (e.g. day 31 in Feb -> 28 or 29).
 */
export function clampDayToMonth(year: number, month: number, targetDay: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.min(targetDay, maxDays);
}

/**
 * Formats YYYY-MM-DD cleanly without timezone offset drift
 */
export function formatYMD(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD into numbers { year, month, day }
 */
export function parseYMD(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

/**
 * Generates the next N dates for a given recurrence pattern,
 * strictly handling month ends (e.g. 31 in February -> 28/29).
 */
export function generateNextDates(
  startDateStr: string,
  frequency: AccountFrequency,
  count = 12,
  preferredDueDay?: number
): string[] {
  const parsed = parseYMD(startDateStr);
  let currentYear = parsed.year;
  let currentMonth = parsed.month;
  const baseDay = preferredDueDay || parsed.day;

  const dates: string[] = [];

  if (frequency === 'weekly') {
    let curr = new Date(parsed.year, parsed.month - 1, parsed.day);
    for (let i = 0; i < count; i++) {
      const y = curr.getFullYear();
      const m = curr.getMonth() + 1;
      const d = curr.getDate();
      dates.push(formatYMD(y, m, d));
      curr = new Date(curr.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    return dates;
  }

  let stepMonths = 1;
  if (frequency === 'bimonthly') stepMonths = 2;
  else if (frequency === 'quarterly') stepMonths = 3;
  else if (frequency === 'semiannual') stepMonths = 6;
  else if (frequency === 'annual') stepMonths = 12;
  else stepMonths = 1; // monthly, custom

  for (let i = 0; i < count; i++) {
    const validDay = clampDayToMonth(currentYear, currentMonth, baseDay);
    dates.push(formatYMD(currentYear, currentMonth, validDay));

    // advance by stepMonths
    currentMonth += stepMonths;
    while (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }
  }

  return dates;
}

/**
 * Calculates days difference from today.
 * Negative means overdue, 0 means today, positive means in future.
 */
export function getDaysUntil(dueDateStr: string): number {
  const now = new Date();
  const todayStr = formatYMD(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dueDateStr.split('-').map(Number);

  const todayUtc = Date.UTC(ty, tm - 1, td);
  const dueUtc = Date.UTC(dy, dm - 1, dd);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueUtc - todayUtc) / msPerDay);
}
