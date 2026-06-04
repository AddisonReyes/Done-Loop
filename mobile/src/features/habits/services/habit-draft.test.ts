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
        weeklyDays: [1, 2],
        monthlyDays: [15],
        reminderTime: '07:30',
      })
    ).toMatchObject({
      name: 'Read',
      description: 'Daily pages',
      customIntervalDays: 3,
      weeklyDays: undefined,
      monthlyDays: undefined,
      reminderTime: '07:30',
      isActive: true,
    });
  });

  it('normalizes selected recurrence days and clears fields for other recurrence types', () => {
    expect(
      normalizeHabitCreateDraft({
        name: 'Gym',
        recurrenceType: 'weekly',
        customIntervalDays: 5,
        weeklyDays: [5, 1, 5, 8, 0, 3],
        monthlyDays: [15],
      })
    ).toMatchObject({
      customIntervalDays: undefined,
      weeklyDays: [1, 3, 5],
      monthlyDays: undefined,
    });

    expect(
      normalizeHabitUpdateDraft({
        recurrenceType: 'monthly',
        weeklyDays: [1],
        monthlyDays: [31, 15, 31, 32, -1],
      })
    ).toMatchObject({
      weeklyDays: undefined,
      monthlyDays: [15, 31],
    });

    expect(
      normalizeHabitUpdateDraft({
        recurrenceType: 'daily',
        customIntervalDays: 2,
        weeklyDays: [1],
        monthlyDays: [1],
      })
    ).toMatchObject({
      customIntervalDays: undefined,
      weeklyDays: undefined,
      monthlyDays: undefined,
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

  it('rejects custom recurrence drafts without a valid interval', () => {
    expect(
      normalizeHabitCreateDraft({
        name: 'Stretch',
        recurrenceType: 'custom',
      })
    ).toBeNull();
    expect(
      normalizeHabitCreateDraft({
        name: 'Stretch',
        recurrenceType: 'custom',
        customIntervalDays: 0,
      })
    ).toBeNull();
    expect(
      normalizeHabitUpdateDraft({
        recurrenceType: 'custom',
        customIntervalDays: -1,
      })
    ).toBeNull();
    expect(
      normalizeHabitUpdateDraft({
        recurrenceType: 'custom',
        customIntervalDays: 1.5,
      })
    ).toBeNull();
  });

  it('preserves valid custom recurrence intervals', () => {
    expect(
      normalizeHabitCreateDraft({
        name: 'Stretch',
        recurrenceType: 'custom',
        customIntervalDays: 4,
      })
    ).toMatchObject({
      recurrenceType: 'custom',
      customIntervalDays: 4,
    });
    expect(
      normalizeHabitUpdateDraft({
        recurrenceType: 'custom',
        customIntervalDays: 2,
      })
    ).toMatchObject({
      recurrenceType: 'custom',
      customIntervalDays: 2,
    });
  });

  it('leaves unrelated partial update fields untouched', () => {
    expect(normalizeHabitUpdateDraft({ notificationId: 'notification_1' })).toEqual({
      notificationId: 'notification_1',
    });
  });
});
