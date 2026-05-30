import type { SQLiteDatabase } from 'expo-sqlite';

export const migration002AddLanguageSetting = {
  id: 2,
  name: 'add_language_setting',
  async up(database: SQLiteDatabase): Promise<void> {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const hasLanguage = columns.some((column) => column.name === 'language');

    if (!hasLanguage) {
      await database.execAsync(`
        ALTER TABLE user_settings
        ADD COLUMN language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es'));
      `);
    }
  },
} as const;
