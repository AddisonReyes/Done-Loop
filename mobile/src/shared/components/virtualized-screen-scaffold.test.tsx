import { ComponentType, ReactNode } from 'react';
import { FlatList, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { VirtualizedScreenScaffold } from './virtualized-screen-scaffold';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('@/hooks/use-theme-preference', () => ({
  useThemePreference: () => ({
    accentColor: 'purple',
    appBackground: 'none',
    resolvedTheme: 'light',
  }),
}));

jest.mock('@/shared/components/app-background', () => ({
  AppBackground: () => null,
}));

type Row = {
  id: string;
  label: string;
};

describe('VirtualizedScreenScaffold', () => {
  it('shows a message without actions only while the list is empty', () => {
    const { rerender } = render(
      <VirtualizedScreenScaffold<Row>
        title="Tasks"
        data={[]}
        emptyMessage="No tasks yet."
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
      />
    );

    expect(screen.getAllByText('No tasks yet.')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <VirtualizedScreenScaffold
        title="Tasks"
        data={[{ id: 'row_1', label: 'First row' }]}
        emptyMessage="No tasks yet."
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
      />
    );

    expect(screen.queryByText('No tasks yet.')).toBeNull();
    expect(screen.getByText('First row')).toBeTruthy();
  });

  it('constrains header, footer, and FlatList cells to the screen content width', () => {
    const { UNSAFE_getByType } = render(
      <VirtualizedScreenScaffold
        title="Tasks"
        data={[{ id: 'row_1', label: 'First row' }]}
        keyExtractor={(item) => item.id}
        listHeader={<Text>Header content</Text>}
        listFooter={<Text>Footer content</Text>}
        renderItem={({ item }) => <Text>{item.label}</Text>}
      />
    );

    const flatList = UNSAFE_getByType(FlatList<Row>);
    const CellRenderer = flatList.props.CellRendererComponent as ComponentType<{ children: ReactNode }>;
    const renderedCell = render(
      <CellRenderer>
        <Text>Cell content</Text>
      </CellRenderer>
    ).toJSON();

    expect(flatList.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })])
    );
    expect(flatList.props.ListHeaderComponentStyle).toEqual(
      expect.objectContaining({ alignSelf: 'center', maxWidth: 720, minWidth: 0, width: '100%' })
    );
    expect(flatList.props.ListFooterComponent.props.style).toEqual(
      expect.objectContaining({ alignSelf: 'center', maxWidth: 720, minWidth: 0, width: '100%' })
    );
    expect(renderedCell).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          style: expect.arrayContaining([
            expect.objectContaining({ alignSelf: 'center', maxWidth: 720, minWidth: 0, width: '100%' }),
          ]),
        }),
      })
    );
  });
});
