import { Colors } from '@/constants/theme';
import type { UserSettings } from '@/features/settings/types';
import type { Habit } from '@/features/habits/types';
import type { Todo } from '@/features/todos/types';
import { translations } from '@/i18n/translations';

export const mockTheme = {
  ...Colors.light,
  accent: '#8B5CF6',
  accentSoft: 'rgba(139, 92, 246, 0.14)',
  accentStrong: '#6D28D9',
  borderStrong: '#D7C8F7',
  historyEmpty: '#FFFFFF',
  historyLevel1: 'rgba(168, 85, 247, 0.18)',
  historyLevel2: 'rgba(168, 85, 247, 0.34)',
  historyLevel3: 'rgba(168, 85, 247, 0.62)',
  historyLevel4: '#A855F7',
  historyPartial: 'rgba(168, 85, 247, 0.34)',
  historyComplete: '#A855F7',
};

type TranslationParams = Record<string, string | number>;

export function createTestTranslator(language: keyof typeof translations = 'en') {
  return (key: string, params?: TranslationParams) => {
    const segments = key.split('.');
    let value: unknown = translations[language];

    for (const segment of segments) {
      if (!value || typeof value !== 'object' || !(segment in value)) {
        return key;
      }

      value = (value as Record<string, unknown>)[segment];
    }

    const template = typeof value === 'string' ? value : key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, paramKey: string) => String(params?.[paramKey] ?? ''));
  };
}

export const mockSafeAreaInsets = { bottom: 0, left: 0, right: 0, top: 0 };

export const defaultTestSettings: UserSettings = {
  animationsEnabled: false,
  accentColor: 'purple',
  appBackground: 'none',
  dateFormat: 'dmy',
  language: 'en',
  notificationsEnabled: false,
  privacyPolicyUrl: 'https://done-loop.com/privacy',
  termsUrl: 'https://done-loop.pages.dev/terms',
  theme: 'system',
};

export function createTestHabit(input: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Read',
    recurrenceType: 'daily',
    remindersEnabled: false,
    isActive: true,
    startDate: '2026-06-01',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...input,
  };
}

export function createTestTodo(input: Partial<Todo> = {}): Todo {
  return {
    id: 'todo_1',
    title: 'Buy milk',
    priority: 2,
    status: 'pending',
    dueAt: '2026-06-06',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...input,
  };
}
