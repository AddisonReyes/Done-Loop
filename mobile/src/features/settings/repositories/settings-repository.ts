import {
  fromSQLiteBoolean,
  nullableString,
  optionalString,
  toSQLiteBoolean,
} from '@/storage/database/sqlite-mappers';
import { getDatabaseAsync } from '@/storage/database/client';

import type {
  UpdateUserSettingsInput,
  UserAccentColorPreference,
  UserAppBackgroundPreference,
  UserDateFormatPreference,
  UserLanguagePreference,
  UserSettings,
  UserThemePreference,
} from '../types';

const PrivacyPolicyUrl = 'https://done-loop.pages.dev/privacy';
const TermsUrl = 'https://done-loop.pages.dev/terms';
const FreePlan = 'free';
const settingsListeners = new Set<(settings: UserSettings) => void>();

type UserSettingsRow = {
  notifications_enabled: number;
  theme: UserThemePreference;
  accent_color: UserAccentColorPreference;
  app_background: UserAppBackgroundPreference;
  language: UserLanguagePreference;
  date_format: UserDateFormatPreference;
  privacy_policy_url: string | null;
  terms_url: string | null;
};

const defaultSettings: UserSettings = {
  notificationsEnabled: false,
  theme: 'system',
  accentColor: 'purple',
  appBackground: 'none',
  language: 'en',
  dateFormat: 'dmy',
  privacyPolicyUrl: PrivacyPolicyUrl,
  termsUrl: TermsUrl,
};

function mapUserSettingsRow(row: UserSettingsRow): UserSettings {
  return {
    notificationsEnabled: fromSQLiteBoolean(row.notifications_enabled),
    theme: row.theme,
    accentColor: row.accent_color,
    appBackground: row.app_background,
    language: row.language,
    dateFormat: row.date_format,
    privacyPolicyUrl: optionalString(row.privacy_policy_url) ?? PrivacyPolicyUrl,
    termsUrl: optionalString(row.terms_url) ?? TermsUrl,
  };
}

export const SettingsRepository = {
  subscribe(listener: (settings: UserSettings) => void): () => void {
    settingsListeners.add(listener);
    return () => {
      settingsListeners.delete(listener);
    };
  },

  async get(): Promise<UserSettings> {
    const database = await getDatabaseAsync();
    const row = await database.getFirstAsync<UserSettingsRow>(
      `SELECT notifications_enabled, theme, accent_color, app_background, language, date_format, privacy_policy_url, terms_url
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
      `SELECT notifications_enabled, theme, accent_color, app_background, language, date_format, privacy_policy_url, terms_url
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
        accent_color,
        app_background,
        language,
        date_format,
        plan,
        privacy_policy_url,
        terms_url,
        created_at,
        updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        notifications_enabled = excluded.notifications_enabled,
        theme = excluded.theme,
        accent_color = excluded.accent_color,
        app_background = excluded.app_background,
        language = excluded.language,
        date_format = excluded.date_format,
        plan = excluded.plan,
        privacy_policy_url = excluded.privacy_policy_url,
        terms_url = excluded.terms_url,
        updated_at = excluded.updated_at;`,
      toSQLiteBoolean(next.notificationsEnabled),
      next.theme,
      next.accentColor,
      next.appBackground,
      next.language,
      next.dateFormat,
      FreePlan,
      nullableString(next.privacyPolicyUrl),
      nullableString(next.termsUrl),
      now,
      now
    );

    settingsListeners.forEach((listener) => listener(next));

    return next;
  },

  async reset(): Promise<UserSettings> {
    const database = await getDatabaseAsync();
    await database.runAsync('DELETE FROM user_settings WHERE id = 1;');
    return this.update(defaultSettings);
  },
};
