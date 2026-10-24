import { ReactElement, ReactNode, useMemo, type Ref } from 'react';
import {
  FlatList,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
  type ListRenderItem,
  type FlatListProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { AppBackground, type AppBackgroundSnapshot } from '@/shared/components/app-background';

type VirtualizedScreenScaffoldProps<ItemT> = {
  contentContainerStyle?: StyleProp<ViewStyle>;
  data: readonly ItemT[];
  description?: string;
  emptyMessage?: string;
  eyebrow?: string;
  keyExtractor: (item: ItemT, index: number) => string;
  listFooter?: ReactElement | null;
  listHeader?: ReactElement | null;
  listRef?: Ref<FlatList<ItemT>>;
  onScrollToIndexFailed?: FlatListProps<ItemT>['onScrollToIndexFailed'];
  renderItem: ListRenderItem<ItemT>;
  title: string;
};

export function VirtualizedScreenScaffold<ItemT>({
  contentContainerStyle,
  data,
  description,
  emptyMessage,
  eyebrow,
  keyExtractor,
  listFooter,
  listHeader,
  listRef,
  onScrollToIndexFailed,
  renderItem,
  title,
}: VirtualizedScreenScaffoldProps<ItemT>) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { appBackground, resolvedTheme } = useThemePreference();
  const hasSupportingText = !!eyebrow || !!description;
  const currentBackground: AppBackgroundSnapshot = useMemo(
    () => ({
      accent: theme.accent,
      background: theme.background,
      preference: appBackground,
      resolvedTheme,
    }),
    [appBackground, resolvedTheme, theme.accent, theme.background]
  );

  const header = (
    <View style={styles.inner}>
      <View style={[styles.header, !hasSupportingText && styles.compactHeader]}>
        {eyebrow ? (
          <ThemedText type="smallBold" themeColor="accentStrong" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        ) : null}
      </View>

      {listHeader ? <View style={styles.contentStack}>{listHeader}</View> : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppBackground {...currentBackground} />
      <FlatList
        ref={listRef}
        onScrollToIndexFailed={onScrollToIndexFailed}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
            paddingLeft: Math.max(insets.left, Spacing.three),
            paddingRight: Math.max(insets.right, Spacing.three),
          },
          contentContainerStyle,
        ]}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={styles.headerComponent}
        ListEmptyComponent={emptyMessage ? (
          <View style={styles.emptyContent}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyMessage}>
              {emptyMessage}
            </ThemedText>
          </View>
        ) : undefined}
        ListFooterComponent={listFooter ? <View style={styles.footer}>{listFooter}</View> : undefined}
        ItemSeparatorComponent={ListGap}
        CellRendererComponent={ConstrainedCell}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function ConstrainedCell({ children, style, ...props }: ViewProps & { children?: ReactNode }) {
  return (
    <View {...props} style={[style, styles.constrainedContent]}>
      {children}
    </View>
  );
}

function ListGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    width: '100%',
  },
  inner: {
    gap: Spacing.three,
    minWidth: 0,
    width: '100%',
  },
  header: {
    gap: Spacing.two,
  },
  compactHeader: {
    gap: 0,
  },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  description: {
    maxWidth: 420,
    minWidth: 0,
  },
  contentStack: {
    gap: Spacing.three,
  },
  headerComponent: {
    alignSelf: 'center',
    marginBottom: Spacing.three,
    maxWidth: 720,
    minWidth: 0,
    width: '100%',
  },
  constrainedContent: {
    alignSelf: 'center',
    maxWidth: 720,
    minWidth: 0,
    width: '100%',
  },
  footer: {
    alignSelf: 'center',
    marginTop: Spacing.three,
    maxWidth: 720,
    minWidth: 0,
    width: '100%',
  },
  emptyContent: {
    alignItems: 'center',
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 720,
    paddingVertical: Spacing.four,
    width: '100%',
  },
  emptyMessage: {
    textAlign: 'center',
  },
  itemGap: {
    height: Spacing.two,
  },
});
