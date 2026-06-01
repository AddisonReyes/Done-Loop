export type ReminderTime = {
  hour: number;
  minute: number;
};

export function parseReminderTime(reminderTime?: string): ReminderTime | null {
  if (!reminderTime || !/^\d{2}:\d{2}$/.test(reminderTime)) {
    return null;
  }

  const [hour, minute] = reminderTime.split(':').map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

