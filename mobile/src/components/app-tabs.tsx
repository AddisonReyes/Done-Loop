import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserLastActiveRoute } from '@/features/settings/types';
import { NotesNavigationGuardProvider, useNotesNavigationGuard } from '@/features/notes/services/navigation-guard';

type TabIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const iconByRoute: Record<string, TabIconName> = {
  habits: 'checkbox-marked-circle-outline',
  todos: 'format-list-checks',
  notes: 'notebook-outline',
  calendar: 'calendar',
  settings: 'cog-outline',
};

export default function AppTabs() {
  return (
    <NotesNavigationGuardProvider>
      <AppTabNavigation />
    </NotesNavigationGuardProvider>
  );
}

function AppTabNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {
    const route = getTopLevelRoute(pathname);
    if (route) {
      void SettingsRepository.update({ lastActiveRoute: route }).catch(() => undefined);
    }
  }, [pathname]);

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {/* Headless tabs register screens through triggers, including startup. */}
          <TabTrigger name="index" href="/" style={styles.hiddenStartupRoute} />
          <TabTrigger name="habits" href="/habits" asChild>
            <TabButton label={t('tabs.habits')} iconName={iconByRoute.habits} />
          </TabTrigger>
          <TabTrigger name="todos" href="/todos" asChild>
            <TabButton label={t('tabs.todos')} iconName={iconByRoute.todos} />
          </TabTrigger>
          <TabTrigger name="notes" href="/notes" resetOnFocus asChild>
            <TabButton label={t('tabs.notes')} iconName={iconByRoute.notes} />
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

export function getTopLevelRoute(pathname: string): UserLastActiveRoute | null {
  if (pathname === '/habits' || pathname.startsWith('/habits/')) return '/habits';
  if (pathname === '/todos' || pathname.startsWith('/todos/')) return '/todos';
  if (pathname === '/notes' || pathname.startsWith('/notes/')) return '/notes';
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return '/calendar';
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return '/settings';
  return null;
}

export function TabButton({
  label,
  iconName,
  isFocused,
  onPress,
  onLongPress,
  ...props
}: TabTriggerSlotProps & { label: string; iconName: TabIconName }) {
  const theme = useTheme();
  const { requestLeave } = useNotesNavigationGuard();
  const isNavigatingRef = useRef(false);
  // TabTrigger handles routing; a browser link must not bypass the save guard.
  const pressableProps = { ...props, href: undefined };

  const handlePress: NonNullable<TabTriggerSlotProps['onPress']> = (event) => {
    if (isFocused) {
      onPress?.(event);
      return;
    }
    if (isNavigatingRef.current) return;
    event.persist();
    isNavigatingRef.current = true;
    void requestLeave().then((canLeave) => {
      if (canLeave) onPress?.(event);
    }).catch(() => undefined).finally(() => {
      isNavigatingRef.current = false;
    });
  };

  const handleLongPress: NonNullable<TabTriggerSlotProps['onLongPress']> = (event) => {
    if (isFocused) {
      onLongPress?.(event);
      return;
    }
    if (isNavigatingRef.current) return;
    event.persist();
    isNavigatingRef.current = true;
    void requestLeave().then((canLeave) => {
      if (canLeave) onLongPress?.(event);
    }).catch(() => undefined).finally(() => {
      isNavigatingRef.current = false;
    });
  };

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onPress={handlePress}
      onLongPress={handleLongPress}
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
  hiddenStartupRoute: {
    display: 'none',
  },
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
    minHeight: 44,
    justifyContent: 'center',
    maxWidth: 56,
    minWidth: 44,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});
