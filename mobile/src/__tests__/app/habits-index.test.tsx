import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { useHabits } from '@/features/habits/hooks/use-habits';
import { createTestHabit, createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import HabitsScreen from '@/app/habits';

type UseHabitsResult = ReturnType<typeof useHabits>;

const mockUseHabits = jest.fn<UseHabitsResult, []>();

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockTheme,
}));

jest.mock('@/hooks/use-theme-preference', () => ({
  useThemePreference: () => ({
    animationsEnabled: false,
    appBackground: 'none',
    resolvedTheme: 'light',
  }),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'en',
    locale: 'en',
    t: mockCreateTestTranslator('en'),
  }),
}));

jest.mock('@/shared/components/app-background', () => ({
  AppBackground: () => null,
}));

jest.mock('@/features/habits/hooks/use-habits', () => ({
  useHabits: () => mockUseHabits(),
}));

function createUseHabitsResult(input: Partial<UseHabitsResult> = {}): UseHabitsResult {
  const habit = createTestHabit();

  return {
    completedHabitIds: new Set<string>(),
    createHabitFromDraft: jest.fn(async () => true),
    deleteHabit: jest.fn(async () => true),
    errorMessage: null,
    filter: 'all',
    getCompletedHabitIdsForDate: jest.fn(() => new Set<string>()),
    getHabitsForDate: jest.fn(() => [habit]),
    goToNextMonth: jest.fn(),
    goToPreviousMonth: jest.fn(),
    habits: [habit],
    isLoading: false,
    monthDateKeys: ['2026-06-01', '2026-06-02', '2026-06-03'],
    monthHistoryDays: [
      {
        activity: 'none',
        completedCount: 0,
        dateKey: '2026-06-01',
        dayNumber: 1,
        intensity: 0,
        scheduledCount: 1,
      },
      {
        activity: 'partial',
        completedCount: 1,
        dateKey: '2026-06-02',
        dayNumber: 2,
        intensity: 2,
        scheduledCount: 2,
      },
      {
        activity: 'complete',
        completedCount: 1,
        dateKey: '2026-06-03',
        dayNumber: 3,
        intensity: 4,
        scheduledCount: 1,
      },
    ],
    monthLabel: 'June 2026',
    monthlyHabitDateKeys: new Set<string>(),
    pendingCount: 1,
    setFilter: jest.fn(),
    todayKey: '2026-06-03',
    toggleCompletionForDate: jest.fn(async () => true),
    toggleTodayCompletion: jest.fn(async () => true),
    totalCompletedToday: 0,
    updateHabitFromDraft: jest.fn(async () => true),
    visibleHabits: [habit],
    ...input,
  };
}

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the habit dashboard and toggles the listed habit', () => {
    const toggleCompletionForDate = jest.fn(async () => true);
    mockUseHabits.mockReturnValue(createUseHabitsResult({ toggleCompletionForDate }));

    render(<HabitsScreen />);

    expect(screen.getByText('Habits')).toBeTruthy();
    expect(screen.getByText('Read')).toBeTruthy();
    expect(screen.getByText('completed')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Pending today'));

    expect(toggleCompletionForDate).toHaveBeenCalledWith('habit_1', '2026-06-03');
  });

  it('shows loading, error, and empty states without hiding the create action', () => {
    mockUseHabits.mockReturnValue(
      createUseHabitsResult({
        errorMessage: 'Could not load habits.',
        habits: [],
        isLoading: false,
        visibleHabits: [],
      })
    );

    render(<HabitsScreen />);

    expect(screen.getByText('Could not load habits.')).toBeTruthy();
    expect(screen.getByText('You do not have active habits yet. Create the first one to start today’s loop.')).toBeTruthy();
    expect(screen.getAllByText('Create').length).toBeGreaterThan(0);
  });

  it('filters by selected calendar date and clears the date selection', () => {
    const selectedHabit = createTestHabit({ id: 'habit_selected', name: 'Pay bills', recurrenceType: 'monthly' });
    mockUseHabits.mockReturnValue(
      createUseHabitsResult({
        getHabitsForDate: jest.fn((dateKey: string) => (dateKey === '2026-06-02' ? [selectedHabit] : [])),
      })
    );

    render(<HabitsScreen />);
    fireEvent.press(screen.getByLabelText(/2026-06-02/));

    expect(screen.getByText('Pay bills')).toBeTruthy();
    expect(screen.getByText(/Selected/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear selected day'));

    expect(screen.queryByText('Pay bills')).toBeNull();
  });

  it('confirms deletes before calling the hook delete action', () => {
    const deleteHabit = jest.fn(async () => true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseHabits.mockReturnValue(createUseHabitsResult({ deleteHabit }));

    render(<HabitsScreen />);
    fireEvent.press(screen.getByLabelText('Delete'));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive');
    destructiveAction?.onPress?.();

    expect(deleteHabit).toHaveBeenCalledWith('habit_1');
  });
});
