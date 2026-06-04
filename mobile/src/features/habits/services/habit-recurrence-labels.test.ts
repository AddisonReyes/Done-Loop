import type { Habit } from '@/features/habits/types';

import { getHabitRecurrenceDetail } from './habit-recurrence-labels';

function createHabit(overrides: Partial<Habit>): Habit {
  return {
    id: 'habit_1',
    name: 'Read',
    recurrenceType: 'daily',
    remindersEnabled: false,
    isActive: true,
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  };
}

const translations: Record<string, string> = {
  'habits.detail.days': 'Days',
  'habits.detail.dates': 'Dates',
  'habits.detail.interval': 'Interval',
  'habits.weekdayShort.1': 'Mon',
  'habits.weekdayShort.3': 'Wed',
  'habits.weekdayShort.5': 'Fri',
  'habits.everyDays': 'Every {{count}} days',
};

function t(key: string, params?: Record<string, string | number>): string {
  const template = translations[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, param: string) => String(params?.[param] ?? ''));
}

describe('habit recurrence labels', () => {
  it('formats selected weekly days', () => {
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'weekly', weeklyDays: [1, 3, 5] }), t)).toEqual({
      label: 'Days',
      value: 'Mon, Wed, Fri',
    });
  });

  it('formats selected monthly dates', () => {
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'monthly', monthlyDays: [15, 30] }), t)).toEqual({
      label: 'Dates',
      value: '15, 30',
    });
  });

  it('truncates long monthly date lists', () => {
    expect(
      getHabitRecurrenceDetail(createHabit({ recurrenceType: 'monthly', monthlyDays: [1, 2, 3, 4, 5, 6, 7] }), t)
    ).toEqual({
      label: 'Dates',
      value: '1, 2, 3, 4, 5, 6, ...',
    });
  });

  it('formats custom intervals descriptively', () => {
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'custom', customIntervalDays: 3 }), t)).toEqual({
      label: 'Interval',
      value: 'Every 3 days',
    });
  });

  it('uses createdAt as a fallback for legacy weekly and monthly habits', () => {
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'weekly' }), t)).toEqual({
      label: 'Days',
      value: 'Fri',
    });
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'monthly' }), t)).toEqual({
      label: 'Dates',
      value: '1',
    });
  });

  it('does not add extra detail for daily habits', () => {
    expect(getHabitRecurrenceDetail(createHabit({ recurrenceType: 'daily' }), t)).toBeNull();
  });
});
