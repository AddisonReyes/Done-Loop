import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

type TabIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const iconByRoute: Record<string, TabIconName> = {
  habits: 'checkbox-marked-circle-outline',
  todos: 'format-list-checks',
  calendar: 'calendar',
  settings: 'cog-outline',
};

export default function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="habits" href="/habits" asChild>
            <TabButton label={t('tabs.habits')} iconName={iconByRoute.habits} />
          </TabTrigger>
          <TabTrigger name="todos" href="/todos" asChild>
            <TabButton label={t('tabs.todos')} iconName={iconByRoute.todos} />
          </TabTrigger>
          <TabTrigger name="calendar" href="/calendar" asChild>
            <TabButton label={t('tabs.calendar')} iconName={iconByRoute.calendar} />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton label={t('tabs.settings')} iconName={iconByRoute.settings} />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  label,
  iconName,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; iconName: TabIconName }) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={styles.tabButtonView}>
        <MaterialCommunityIcons
          name={iconName}
          size={23}
          color={isFocused ? theme.accentStrong : theme.textSecondary}
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
      style={[
        styles.tabListContainer,
        {
          backgroundColor: theme.backgroundElement,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          shadowColor: theme.glow,
        },
      ]}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: 'transparent',
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
    position: 'absolute',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: '100%',
  },
  innerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 52,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabButtonView: {
    alignItems: 'center',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 56,
  },
  pressed: {
    opacity: 0.72,
  },
});
