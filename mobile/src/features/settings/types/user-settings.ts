export type UserThemePreference = 'system' | 'light' | 'dark';
export type UserAccentColorPreference = 'purple' | 'blue' | 'green' | 'red' | 'yellow' | 'pink';
export type UserAppBackgroundPreference = 'none' | 'gradient' | 'grid';
export type UserLanguagePreference = 'en' | 'es';
export type UserDateFormatPreference = 'iso' | 'mdy' | 'dmy' | 'long';

export type UserSettings = {
  notificationsEnabled: boolean;
  theme: UserThemePreference;
  accentColor: UserAccentColorPreference;
  appBackground: UserAppBackgroundPreference;
  language: UserLanguagePreference;
  dateFormat: UserDateFormatPreference;
  privacyPolicyUrl: string;
  termsUrl: string;
};

export type UpdateUserSettingsInput = Partial<UserSettings>;
