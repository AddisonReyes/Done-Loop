import {
  fromSQLiteBoolean,
  nullableString,
  optionalString,
  toSQLiteBoolean,
} from '@/storage/database/sqlite-mappers';
import { getDatabaseAsync } from '@/storage/database/client';

import type {
  UpdateUserSettingsInput,
  UserLanguagePreference,
  UserPlan,
  UserSettings,
  UserThemePreference,
} from '../types';

type UserSettingsRow = {
  notifications_enabled: number;
  theme: UserThemePreference;
  language: UserLanguagePreference;
  plan: UserPlan;
  privacy_policy_url: string | null;
  terms_url: string | null;
};

const defaultSettings: UserSettings = {
  notificationsEnabled: false,
  theme: 'system',
  language: 'en',
  plan: 'free',
};

function mapUserSettingsRow(row: UserSettingsRow): UserSettings {
  return {
    notificationsEnabled: fromSQLiteBoolean(row.notifications_enabled),
    theme: row.theme,
    language: row.language,
    plan: row.plan,
    privacyPolicyUrl: optionalString(row.privacy_policy_url),
    termsUrl: optionalString(row.terms_url),
  };
}

export const SettingsRepository = {
  async get(): Promise<UserSettings> {
    const database = await getDatabaseAsync();
    const row = await database.getFirstAsync<UserSettingsRow>(
      `SELECT notifications_enabled, theme, plan, privacy_policy_url, terms_url
       , language
       FROM user_settings
       WHERE id = 1;`
    );

    if (row) {
      return mapUserSettingsRow(row);
    }

    return this.update(defaultSettings);
  },

  async update(input: UpdateUserSettingsInput): Promise<UserSettings> {
    const database = await getDatabaseAsync();
    const existingRow = await database.getFirstAsync<UserSettingsRow>(
      `SELECT notifications_enabled, theme, plan, privacy_policy_url, terms_url
       , language
       FROM user_settings
       WHERE id = 1;`
    );
    const existing = existingRow ? mapUserSettingsRow(existingRow) : defaultSettings;
    const next: UserSettings = {
      ...existing,
      ...input,
    };
    const now = new Date().toISOString();

    await database.runAsync(
      `INSERT INTO user_settings (
        id,
        notifications_enabled,
        theme,
        language,
        plan,
        privacy_policy_url,
        terms_url,
        created_at,
        updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        notifications_enabled = excluded.notifications_enabled,
        theme = excluded.theme,
        language = excluded.language,
        plan = excluded.plan,
        privacy_policy_url = excluded.privacy_policy_url,
        terms_url = excluded.terms_url,
        updated_at = excluded.updated_at;`,
      toSQLiteBoolean(next.notificationsEnabled),
      next.theme,
      next.language,
      next.plan,
      nullableString(next.privacyPolicyUrl),
      nullableString(next.termsUrl),
      now,
      now
    );

    return next;
  },

  async reset(): Promise<UserSettings> {
    const database = await getDatabaseAsync();
    await database.runAsync('DELETE FROM user_settings WHERE id = 1;');
    return this.update(defaultSettings);
  },
};
