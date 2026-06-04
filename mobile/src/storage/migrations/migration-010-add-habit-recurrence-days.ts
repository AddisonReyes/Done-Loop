import type { SQLiteDatabase } from 'expo-sqlite';

export const migration010AddHabitRecurrenceDays = {
  id: 10,
  name: 'add_habit_recurrence_days',
  async up(database: SQLiteDatabase): Promise<void> {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(habits);');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('weekly_days')) {
      await database.execAsync(`
        ALTER TABLE habits
        ADD COLUMN weekly_days TEXT;
      `);
    }

    if (!columnNames.has('monthly_days')) {
      await database.execAsync(`
        ALTER TABLE habits
        ADD COLUMN monthly_days TEXT;
      `);
    }
  },
} as const;
