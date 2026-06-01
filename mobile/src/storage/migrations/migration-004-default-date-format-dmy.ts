import type { SQLiteDatabase } from 'expo-sqlite';

export const migration004DefaultDateFormatDmy = {
  id: 4,
  name: 'default_date_format_dmy',
  async up(database: SQLiteDatabase): Promise<void> {
    await database.runAsync("UPDATE user_settings SET date_format = 'dmy' WHERE date_format = 'iso';");
  },
} as const;
