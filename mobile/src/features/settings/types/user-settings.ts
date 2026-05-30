export type UserPlan = 'free' | 'no_ads' | 'premium';

export type UserThemePreference = 'system' | 'light' | 'dark';
export type UserLanguagePreference = 'en' | 'es';
export type UserDateFormatPreference = 'iso' | 'mdy' | 'dmy' | 'long';

export type UserSettings = {
  notificationsEnabled: boolean;
  theme: UserThemePreference;
  language: UserLanguagePreference;
  dateFormat: UserDateFormatPreference;
  plan: UserPlan;
  privacyPolicyUrl?: string;
  termsUrl?: string;
};

export type UpdateUserSettingsInput = Partial<UserSettings>;
