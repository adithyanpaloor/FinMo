import {
  format,
  formatDistanceToNow,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  subDays,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function toDate(value: Timestamp | Date | string): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return parseISO(value);
}

export function toTimestamp(date: Date | string): Timestamp {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return Timestamp.fromDate(d);
}

export function formatDate(
  value: Timestamp | Date | string,
  fmt = 'dd MMM yyyy'
): string {
  return format(toDate(value), fmt);
}

export function formatRelativeDate(value: Timestamp | Date | string): string {
  const date = toDate(value);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM');
}

export function formatRelativeTime(value: Timestamp | Date | string): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true });
}

export function formatMonth(value: Timestamp | Date | string): string {
  return format(toDate(value), 'MMMM yyyy');
}

export function formatMonthShort(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), 'MMM yy');
}

export function todayInputValue(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getMonthRange(
  month: number,
  year: number
): { start: Date; end: Date } {
  const d = new Date(year, month - 1, 1);
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return getMonthRange(now.getMonth() + 1, now.getFullYear());
}

export function getLast7Days(): { start: Date; end: Date } {
  return { start: subDays(new Date(), 6), end: new Date() };
}

export function getLast30Days(): { start: Date; end: Date } {
  return { start: subDays(new Date(), 29), end: new Date() };
}

export function getLast3Months(): { start: Date; end: Date } {
  return { start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) };
}

export function getLast6Months(): { start: Date; end: Date } {
  return { start: startOfMonth(subMonths(new Date(), 5)), end: endOfMonth(new Date()) };
}

export function getThisYear(): { start: Date; end: Date } {
  return { start: startOfYear(new Date()), end: endOfYear(new Date()) };
}

export function getLastMonthRange(): { start: Date; end: Date } {
  const last = subMonths(new Date(), 1);
  return { start: startOfMonth(last), end: endOfMonth(last) };
}

export function getWeekRange(): { start: Date; end: Date } {
  return { start: startOfWeek(new Date()), end: endOfWeek(new Date()) };
}

export function monthsArray(count: number): { month: number; year: number }[] {
  const result: { month: number; year: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

/** yyyy-MM-dd in the user's local timezone (safe for <input type="date">). */
export function toInputDate(value: Timestamp | Date | string | null | undefined): string {
  if (!value) return '';
  return format(toDate(value), 'yyyy-MM-dd');
}

export function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
