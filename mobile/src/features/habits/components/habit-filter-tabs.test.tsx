import { fireEvent, render, screen } from '@testing-library/react-native';

import { HabitFilterTabs } from './habit-filter-tabs';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    accentSoft: '#eee',
    border: '#ddd',
    borderStrong: '#aaa',
    surfaceSoft: '#fff',
  }),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'habits.filters.all': 'All',
        'habits.filters.pendingToday': 'Pending',
        'habits.filters.completedToday': 'Completed',
      })[key] ?? key,
  }),
}));

describe('HabitFilterTabs', () => {
  it('renders filter options and reports changes', () => {
    const onChange = jest.fn();

    render(<HabitFilterTabs value="all" onChange={onChange} />);

    fireEvent.press(screen.getByText(/pending/i));

    expect(onChange).toHaveBeenCalledWith('pendingToday');
  });
});
