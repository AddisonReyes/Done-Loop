import { createTestHabit } from '@/test/test-utils';
import { createHabitCalendarSelector, getHabitsDueOnDate } from './habit-recurrence';

describe('calendar recurrence reuse', () => {
  it('preserves all recurrence and deletion rules while reusing dates in the same snapshot', () => {
    const habits = [
      createTestHabit(),
      createTestHabit({ id: 'weekly', recurrenceType: 'weekly', weeklyDays: [1, 3, 5] }),
      createTestHabit({ id: 'monthly', recurrenceType: 'monthly', monthlyDays: [15, 31] }),
      createTestHabit({ id: 'custom', recurrenceType: 'custom', customIntervalDays: 3 }),
      createTestHabit({ id: 'deleted', deletedAt: '2026-06-15' }),
    ];
    const select = createHabitCalendarSelector(habits);
    for (let day = 1; day <= 30; day++) {
      const date = `2026-06-${String(day).padStart(2, '0')}`;
      expect(select(date)).toEqual(getHabitsDueOnDate(habits, date));
      expect(select(date)).toBe(select(date));
    }
    const changed = createHabitCalendarSelector(habits.map((habit) => ({ ...habit, isActive: false, deletedAt: undefined })));
    expect(changed('2026-06-01')).toEqual([]);
  });

  it('evicts old dates instead of growing for every month visited', () => {
    const select = createHabitCalendarSelector([createTestHabit()]);
    const first = select('2026-06-01');
    for (let index = 0; index < 63; index++) select(`invalid-${index}`);
    expect(select('2026-06-01')).not.toBe(first);
  });
});
