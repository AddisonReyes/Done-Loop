import {
  isReminderTime,
  normalizeHabitCreateDraft,
  normalizeHabitUpdateDraft,
} from './habit-draft';

describe('habit draft normalization', () => {
  it('validates reminder times with hour and minute ranges', () => {
    expect(isReminderTime('00:00')).toBe(true);
    expect(isReminderTime('23:59')).toBe(true);
    expect(isReminderTime('24:00')).toBe(false);
    expect(isReminderTime('12:60')).toBe(false);
    expect(isReminderTime('8:30')).toBe(false);
  });

  it('normalizes create drafts', () => {
    expect(
      normalizeHabitCreateDraft({
        name: '  Read  ',
        description: '  Daily pages  ',
        recurrenceType: 'custom',
        customIntervalDays: 3,
        reminderTime: '07:30',
      })
    ).toMatchObject({
      name: 'Read',
      description: 'Daily pages',
      customIntervalDays: 3,
      reminderTime: '07:30',
      isActive: true,
    });
  });

  it('rejects empty required names and drops invalid optional values', () => {
    expect(normalizeHabitCreateDraft({ name: ' ', recurrenceType: 'daily' })).toBeNull();
    expect(
      normalizeHabitUpdateDraft({
        name: 'Run',
        customIntervalDays: -1,
        reminderTime: '99:00',
      })
    ).toMatchObject({ customIntervalDays: undefined, reminderTime: undefined });
  });
});

