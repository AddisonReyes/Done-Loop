import type { Habit } from '@/features/habits/types';

import { getHabitsDueOnDate, isHabitDueOnDate } from './habit-recurrence';

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

describe('habit recurrence', () => {
  it('keeps daily habits due every day after creation', () => {
    const habit = createHabit({ recurrenceType: 'daily' });

    expect(isHabitDueOnDate(habit, '2026-05-01')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-02')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-04-30')).toBe(false);
  });

  it('matches weekly legacy and custom intervals from the creation date', () => {
    const weekly = createHabit({ recurrenceType: 'weekly' });
    const custom = createHabit({ recurrenceType: 'custom', customIntervalDays: 3 });

    expect(isHabitDueOnDate(weekly, '2026-05-08')).toBe(true);
    expect(isHabitDueOnDate(weekly, '2026-05-09')).toBe(false);
    expect(isHabitDueOnDate(custom, '2026-05-04')).toBe(true);
    expect(isHabitDueOnDate(custom, '2026-05-05')).toBe(false);
  });

  it('matches weekly habits on selected weekdays', () => {
    const habit = createHabit({ recurrenceType: 'weekly', weeklyDays: [1, 3, 5] });

    expect(isHabitDueOnDate(habit, '2026-05-04')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-06')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-08')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-05')).toBe(false);
  });

  it('runs legacy monthly habits on the same day or month end when needed', () => {
    const habit = createHabit({
      recurrenceType: 'monthly',
      createdAt: '2026-01-31T12:00:00.000Z',
    });

    expect(isHabitDueOnDate(habit, '2026-02-28')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-03-31')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-03-30')).toBe(false);
  });

  it('runs monthly habits on selected days', () => {
    const habit = createHabit({ recurrenceType: 'monthly', monthlyDays: [15, 30] });

    expect(isHabitDueOnDate(habit, '2026-05-15')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-30')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-05-31')).toBe(false);
  });

  it('moves selected monthly days back to the last available day of short months', () => {
    const habit = createHabit({
      recurrenceType: 'monthly',
      monthlyDays: [30, 31],
      createdAt: '2026-01-01T12:00:00.000Z',
    });

    expect(isHabitDueOnDate(habit, '2026-02-28')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-04-30')).toBe(true);
    expect(isHabitDueOnDate(habit, '2026-04-29')).toBe(false);
  });

  it('filters inactive, deleted, and non-due habits', () => {
    expect(
      getHabitsDueOnDate(
        [
          createHabit({ id: 'daily' }),
          createHabit({ id: 'inactive', isActive: false }),
          createHabit({ id: 'deleted', deletedAt: '2026-05-02T00:00:00.000Z' }),
          createHabit({ id: 'weekly', recurrenceType: 'weekly' }),
        ],
        '2026-05-02'
      )
    ).toHaveLength(1);
  });
});
