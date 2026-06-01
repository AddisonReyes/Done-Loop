import {
  addMonths,
  dateKeyToLocalDate,
  formatDateKey,
  getMonthDateKeys,
  isBeforeDateKey,
  isDateKey,
  startOfMonth,
  toDateKey,
} from './date';

describe('date utils', () => {
  it('formats dates as stable date keys', () => {
    expect(toDateKey(new Date(Date.UTC(2026, 4, 31, 12)))).toBe('2026-05-31');
  });

  it('validates real yyyy-mm-dd date keys only', () => {
    expect(isDateKey('2026-02-28')).toBe(true);
    expect(isDateKey('2026-02-31')).toBe(false);
    expect(isDateKey('2026-2-3')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });

  it('builds local month ranges', () => {
    expect(startOfMonth(new Date(2026, 4, 31))).toEqual(new Date(2026, 4, 1));
    expect(addMonths(new Date(2026, 4, 31), 1)).toEqual(new Date(2026, 5, 1));
    expect(getMonthDateKeys(new Date(2024, 1, 15))).toHaveLength(29);
  });

  it('formats date keys by preference', () => {
    expect(formatDateKey('2026-05-31', 'en-US', 'iso')).toBe('2026-05-31');
    expect(formatDateKey('2026-05-31', 'en-US', 'mdy')).toBe('05/31/2026');
    expect(formatDateKey('2026-05-31', 'en-US', 'dmy')).toBe('31/05/2026');
    expect(formatDateKey('not-a-date', 'en-US', 'dmy')).toBe('not-a-date');
  });

  it('converts date keys to local dates', () => {
    expect(dateKeyToLocalDate('2026-05-31')).toEqual(new Date(2026, 4, 31));
    expect(dateKeyToLocalDate('2026-13-01')).toBeNull();
    expect(isBeforeDateKey('2026-05-30', '2026-05-31')).toBe(true);
  });
});

