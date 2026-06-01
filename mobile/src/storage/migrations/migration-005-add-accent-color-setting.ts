import type { SQLiteDatabase } from 'expo-sqlite';

export const migration005AddAccentColorSetting = {
  id: 5,
  name: 'add_accent_color_setting',
  async up(database: SQLiteDatabase): Promise<void> {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const hasAccentColor = columns.some((column) => column.name === 'accent_color');

    if (!hasAccentColor) {
      await database.execAsync(`
        ALTER TABLE user_settings
        ADD COLUMN accent_color TEXT NOT NULL DEFAULT 'purple'
        CHECK (accent_color IN ('purple', 'blue', 'green', 'red', 'yellow', 'pink'));
      `);
    }
  },
} as const;
