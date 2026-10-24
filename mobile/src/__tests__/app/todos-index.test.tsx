import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { useTodos } from '@/features/todos/hooks/use-todos';
import { createTestTodo, createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import TodosScreen from '@/app/todos';

type UseTodosResult = ReturnType<typeof useTodos>;

const mockUseTodos = jest.fn<UseTodosResult, []>();
let mockLanguage: 'en' | 'es' = 'en';

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
    language: mockLanguage,
    locale: mockLanguage,
    t: mockCreateTestTranslator(mockLanguage),
  }),
}));

jest.mock('@/shared/components/app-background', () => ({
  AppBackground: () => null,
}));

jest.mock('@/features/todos/hooks/use-todos', () => ({
  useTodos: () => mockUseTodos(),
}));

function createUseTodosResult(input: Partial<UseTodosResult> = {}): UseTodosResult {
  const todo = createTestTodo();

  return {
    calendarGroups: [['2026-06-06', [todo]]],
    completeTodo: jest.fn(async () => true),
    createTodoFromDraft: jest.fn(async () => true),
    dateFormat: 'dmy',
    deleteTodo: jest.fn(async () => true),
    errorMessage: null,
    getTodoDateLabel: jest.fn(() => 'Due 06/06/2026'),
    isLoading: false,
    reopenTodo: jest.fn(async () => true),
    setSort: jest.fn(),
    setViewMode: jest.fn(),
    sort: 'priority',
    sortedTodos: [todo],
    updateTodoFromDraft: jest.fn(async () => true),
    viewMode: 'list',
    ...input,
  };
}

describe('TodosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = 'en';
  });

  it('renders list mode and completes a pending task', () => {
    const completeTodo = jest.fn(async () => true);
    mockUseTodos.mockReturnValue(createUseTodosResult({ completeTodo }));

    render(<TodosScreen />);

    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Buy milk')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Complete'));

    expect(completeTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo_1' }));
  });

  it('renders calendar mode with date headings and grouped tasks', () => {
    mockUseTodos.mockReturnValue(
      createUseTodosResult({
        calendarGroups: [
          ['2026-06-05', [createTestTodo({ id: 'todo_2', title: 'Pack bags', dueAt: '2026-06-05' })]],
          ['No date', [createTestTodo({ id: 'todo_3', title: 'Someday', dueAt: undefined })]],
        ],
        sortedTodos: [createTestTodo({ id: 'todo_2', title: 'Pack bags', dueAt: '2026-06-05' })],
        viewMode: 'calendar',
      })
    );

    render(<TodosScreen />);

    expect(screen.getByText('Pack bags')).toBeTruthy();
    expect(screen.getByText('Someday')).toBeTruthy();
    expect(screen.getByText('No date')).toBeTruthy();
  });

  it.each([
    { language: 'en' as const, viewMode: 'list' as const },
    { language: 'es' as const, viewMode: 'list' as const },
    { language: 'en' as const, viewMode: 'calendar' as const },
    { language: 'es' as const, viewMode: 'calendar' as const },
  ])('creates from the sole floating action when $viewMode is empty in $language', ({ language, viewMode }) => {
    mockLanguage = language;
    const t = mockCreateTestTranslator(language);
    mockUseTodos.mockReturnValue(createUseTodosResult({ calendarGroups: [], sortedTodos: [], viewMode }));

    render(<TodosScreen />);

    expect(screen.getAllByText(t('todos.empty'))).toHaveLength(1);
    expect(screen.queryByText(t('todos.form.create'))).toBeNull();
    expect(screen.getAllByRole('button', { name: t('common.create') })).toHaveLength(1);
    fireEvent.press(screen.getByRole('button', { name: t('common.create') }));
    expect(screen.getByText(t('todos.form.createTitle'))).toBeTruthy();
  });

  it.each([
    { isLoading: true, errorMessage: null, feedback: 'Loading tasks...' },
    { isLoading: false, errorMessage: 'Could not save task changes.', feedback: 'Could not save task changes.' },
  ])('shows $feedback without an empty message', ({ isLoading, errorMessage, feedback }) => {
    mockUseTodos.mockReturnValue(
      createUseTodosResult({
        errorMessage,
        isLoading,
        calendarGroups: [],
        sortedTodos: [],
      })
    );

    render(<TodosScreen />);

    expect(screen.getByText(feedback)).toBeTruthy();
    expect(screen.queryByText('No tasks yet.')).toBeNull();
    expect(screen.queryByText('Create task')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Create' })).toHaveLength(1);
  });

  it('confirms deletes before calling the hook delete action', () => {
    const deleteTodo = jest.fn(async () => true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseTodos.mockReturnValue(createUseTodosResult({ deleteTodo }));

    render(<TodosScreen />);
    fireEvent.press(screen.getByLabelText('Delete'));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive');
    destructiveAction?.onPress?.();

    expect(deleteTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 'todo_1' }));
  });
});
