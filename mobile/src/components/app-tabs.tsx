import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/i18n';

export default function AppTabs() {
  const { resolvedTheme } = useThemePreference();
  const { t } = useTranslation();
  const colors = Colors[resolvedTheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accentSoft}
      labelStyle={{
        selected: { color: colors.accentStrong },
        default: { color: colors.textSecondary },
      }}>
      <NativeTabs.Trigger name="habits/index">
        <NativeTabs.Trigger.Label>{t('tabs.habits')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="todos/index">
        <NativeTabs.Trigger.Label>{t('tabs.todos')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings/index">
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
