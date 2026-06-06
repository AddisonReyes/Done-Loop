import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { useHabits } from '@/features/habits/hooks/use-habits';
import type { useTodos } from '@/features/todos/hooks/use-todos';
import { createTestHabit, createTestTodo, createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import CalendarScreen from './index';

type UseHabitsResult = ReturnType<typeof useHabits>;
type UseTodosResult = ReturnType<typeof useTodos>;

const mockUseHabits = jest.fn<UseHabitsResult, []>();
const mockUseTodos = jest.fn<UseTodosResult, []>();

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

jest.mock('@/features/todos/hooks/use-todos', () => ({
  useTodos: () => mockUseTodos(),
}));

function createUseHabitsResult(input: Partial<UseHabitsResult> = {}): UseHabitsResult {
  const monthlyHabit = createTestHabit({ id: 'habit_monthly', name: 'Pay rent', recurrenceType: 'monthly' });

  return {
    completedHabitIds: new Set<string>(),
    createHabitFromDraft: jest.fn(async () => true),
    deleteHabit: jest.fn(async () => true),
    errorMessage: null,
    filter: 'all',
    getCompletedHabitIdsForDate: jest.fn(() => new Set<string>()),
    getHabitsForDate: jest.fn((dateKey: string) => (dateKey === '2026-06-03' ? [monthlyHabit] : [])),
    goToNextMonth: jest.fn(),
    goToPreviousMonth: jest.fn(),
    habits: [monthlyHabit],
    isLoading: false,
    monthDateKeys: ['2026-06-01', '2026-06-02', '2026-06-03'],
    monthHistoryDays: [
      { activity: 'none', completedCount: 0, dateKey: '2026-06-01', dayNumber: 1, intensity: 0, scheduledCount: 0 },
      { activity: 'none', completedCount: 0, dateKey: '2026-06-02', dayNumber: 2, intensity: 0, scheduledCount: 0 },
      { activity: 'partial', completedCount: 0, dateKey: '2026-06-03', dayNumber: 3, intensity: 1, scheduledCount: 1 },
    ],
    monthLabel: 'June 2026',
    monthlyHabitDateKeys: new Set(['2026-06-03']),
    pendingCount: 1,
    setFilter: jest.fn(),
    todayKey: '2026-06-03',
    toggleCompletionForDate: jest.fn(async () => true),
    toggleTodayCompletion: jest.fn(async () => true),
    totalCompletedToday: 0,
    updateHabitFromDraft: jest.fn(async () => true),
    visibleHabits: [monthlyHabit],
    ...input,
  };
}

function createUseTodosResult(input: Partial<UseTodosResult> = {}): UseTodosResult {
  const todo = createTestTodo({ id: 'todo_due', title: 'Submit report', dueAt: '2026-06-03' });

  return {
    calendarGroups: [['2026-06-03', [todo]]],
    completeTodo: jest.fn(async () => true),
    createTodoFromDraft: jest.fn(async () => true),
    dateFormat: 'dmy',
    deleteTodo: jest.fn(async () => true),
    errorMessage: null,
    getTodoDateLabel: jest.fn(() => 'Due today'),
    isLoading: false,
    reopenTodo: jest.fn(async () => true),
    setSort: jest.fn(),
    setViewMode: jest.fn(),
    sort: 'priority',
    sortedTodos: [todo],
    updateTodoFromDraft: jest.fn(async () => true),
    viewMode: 'calendar',
    ...input,
  };
}

describe('CalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHabits.mockReturnValue(createUseHabitsResult());
    mockUseTodos.mockReturnValue(createUseTodosResult());
  });

  it('renders month habits and tasks for the visible month', () => {
    render(<CalendarScreen />);

    expect(screen.getByText('Calendar')).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Submit report')).toBeTruthy();
  });

  it('selects a day, shows non-daily habits, and clears the selection', () => {
    render(<CalendarScreen />);

    fireEvent.press(screen.getByLabelText(/2026-06-03/));

    expect(screen.getByText('Pay rent')).toBeTruthy();
    expect(screen.getByText('Submit report')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear selected day'));

    expect(screen.queryByText('Pay rent')).toBeNull();
  });

  it('shows loading, error, and empty task states', () => {
    mockUseHabits.mockReturnValue(createUseHabitsResult({ errorMessage: 'Could not load habits.', isLoading: false }));
    mockUseTodos.mockReturnValue(createUseTodosResult({ calendarGroups: [], isLoading: false }));

    render(<CalendarScreen />);

    expect(screen.getByText('Could not load habits.')).toBeTruthy();
    expect(screen.getByText('No tasks for this month.')).toBeTruthy();
  });

  it('confirms task deletion from the calendar list', () => {
    const deleteTodo = jest.fn(async () => true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseTodos.mockReturnValue(createUseTodosResult({ deleteTodo }));

    render(<CalendarScreen />);
    fireEvent.press(screen.getByLabelText('Delete'));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive');
    destructiveAction?.onPress?.();

    expect(deleteTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo_due' }));
  });
});
