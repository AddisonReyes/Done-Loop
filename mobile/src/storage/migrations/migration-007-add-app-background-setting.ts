import type { SQLiteDatabase } from 'expo-sqlite';

export const migration007AddAppBackgroundSetting = {
  id: 7,
  name: 'add_app_background_setting',
  async up(database: SQLiteDatabase): Promise<void> {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const hasAppBackground = columns.some((column) => column.name === 'app_background');

    if (!hasAppBackground) {
      await database.execAsync(`
        ALTER TABLE user_settings
        ADD COLUMN app_background TEXT NOT NULL DEFAULT 'none'
        CHECK (app_background IN ('none', 'gradient', 'grid'));
      `);
    }
  },
} as const;
