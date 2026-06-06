import { ComponentType, ReactNode } from 'react';
import { FlatList, Text } from 'react-native';
import { render } from '@testing-library/react-native';

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
