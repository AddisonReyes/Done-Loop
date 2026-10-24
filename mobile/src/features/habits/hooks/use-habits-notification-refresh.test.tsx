import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import type { Habit, HabitCompletion } from '@/features/habits/types';
import { toDateKey } from '@/shared/utils/date';
import { useHabits } from './use-habits';

const mockDateKey = toDateKey(new Date());
const mockTranslate = (key: string) => key;
jest.mock('react-native', () => ({ AppState: { currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })) } }));
jest.mock('@/features/habits/repositories', () => ({ HabitRepository: { listVisibleForHistory: jest.fn() },
  HabitCompletionRepository: { listByDateRange: jest.fn() } }));
jest.mock('@/features/notifications/services/notification-service', () => ({ NotificationService: {} }));
jest.mock('@/features/settings/repositories/settings-repository', () => ({ SettingsRepository: {} }));
jest.mock('@/i18n', () => ({ useTranslation: () => ({ language: 'en', locale: 'en', t: mockTranslate }) }));
jest.mock('@/shared/hooks/use-current-date-key', () => ({ useCurrentDateKey: () => mockDateKey }));

describe('habits and Calendar after headless notification actions', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it('reloads today and month history on foreground, then removes its listener on unmount', async () => {
    const habit: Habit = { id: 'habit', name: 'Read', recurrenceType: 'daily', isActive: true,
      remindersEnabled: true, startDate: '2026-01-01', createdAt: '2026-01-01T12:00:00Z', updatedAt: '2026-01-01T12:00:00Z' };
    let completions: HabitCompletion[] = [];
    jest.mocked(HabitRepository.listVisibleForHistory).mockResolvedValue([habit]);
    jest.mocked(HabitCompletionRepository.listByDateRange).mockImplementation(async () => completions);
    let onChange: Parameters<typeof AppState.addEventListener>[1] | undefined;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      onChange = listener;
      return { remove };
    });
    const rendered = await renderHook(() => useHabits());
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    expect(rendered.result.current.pendingCount).toBe(1);
    completions = [{ id: 'completion', habitId: habit.id, date: mockDateKey, completed: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    await act(async () => { onChange?.('background'); onChange?.('active'); });
    expect(rendered.result.current.completedHabitIds.has(habit.id)).toBe(true);
    expect(rendered.result.current.getCompletedHabitIdsForDate(mockDateKey).has(habit.id)).toBe(true);
    expect(rendered.result.current.monthHistoryDays.find((day) => day.dateKey === mockDateKey))
      .toMatchObject({ completedCount: 1, activity: 'complete' });
    await rendered.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
