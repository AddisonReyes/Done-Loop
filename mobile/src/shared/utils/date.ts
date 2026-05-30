import type { UserDateFormatPreference } from '@/features/settings/types';

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function getMonthDateKeys(date: Date): string[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    return toDateKey(new Date(year, month, index + 1));
  });
}

export function formatMonthLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateKey: string, locale: string): string {
  if (!isDateKey(dateKey)) {
    return dateKey;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}

export function dateKeyToLocalDate(dateKey: string): Date | null {
  if (!isDateKey(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(
  dateKey: string | undefined,
  locale: string,
  format: UserDateFormatPreference
): string {
  if (!dateKey || !isDateKey(dateKey)) {
    return dateKey ?? '';
  }

  if (format === 'iso') {
    return dateKey;
  }

  const [year, month, day] = dateKey.split('-').map(Number);

  if (format === 'mdy') {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  }

  if (format === 'dmy') {
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function isBeforeDateKey(a: string, b: string): boolean {
  return a < b;
}
