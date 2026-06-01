import type { SQLiteDatabase } from 'expo-sqlite';

export const migration003AddDateFormatSetting = {
  id: 3,
  name: 'add_date_format_setting',
  async up(database: SQLiteDatabase): Promise<void> {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const hasDateFormat = columns.some((column) => column.name === 'date_format');

    if (!hasDateFormat) {
      await database.execAsync(`
        ALTER TABLE user_settings
        ADD COLUMN date_format TEXT NOT NULL DEFAULT 'dmy' CHECK (date_format IN ('iso', 'mdy', 'dmy', 'long'));
      `);
    }
  },
} as const;
