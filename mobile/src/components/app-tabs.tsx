import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

type TabIconName = SymbolViewProps['name'];

const iconByRoute: Record<string, TabIconName> = {
  habits: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  todos: { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
};

export default function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="habits" href="/habits" asChild>
            <TabButton accessibilityLabel={t('tabs.habits')} iconName={iconByRoute.habits} />
          </TabTrigger>
          <TabTrigger name="todos" href="/todos" asChild>
            <TabButton accessibilityLabel={t('tabs.todos')} iconName={iconByRoute.todos} />
          </TabTrigger>
          <TabTrigger name="calendar" href="/calendar" asChild>
            <TabButton accessibilityLabel={t('tabs.calendar')} iconName={iconByRoute.calendar} />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton accessibilityLabel={t('tabs.settings')} iconName={iconByRoute.settings} />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  accessibilityLabel,
  iconName,
  isFocused,
  ...props
}: TabTriggerSlotProps & { accessibilityLabel: string; iconName: TabIconName }) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused ? theme.accentSoft : 'transparent',
            borderColor: isFocused ? theme.borderStrong : 'transparent',
          },
        ]}>
        <SymbolView
          name={iconName}
          tintColor={isFocused ? theme.accentStrong : theme.textSecondary}
          size={24}
          weight="bold"
        />
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[styles.tabListContainer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            shadowColor: theme.glow,
          },
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    position: 'absolute',
    width: '100%',
  },
  innerContainer: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-around',
    maxWidth: MaxContentWidth,
    minHeight: 70,
    paddingHorizontal: Spacing.two,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabButtonView: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.72,
  },
});
