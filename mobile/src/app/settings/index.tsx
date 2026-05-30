import Constants from 'expo-constants';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AdsService } from '@/features/monetization/ads/ads-service';
import { EntitlementsService } from '@/features/monetization/entitlements/entitlements-service';
import { useSettings } from '@/features/settings/hooks/use-settings';
import type { UserLanguagePreference, UserThemePreference } from '@/features/settings/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

const themeOptions: { value: UserThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.theme.system' },
  { value: 'light', labelKey: 'settings.theme.light' },
  { value: 'dark', labelKey: 'settings.theme.dark' },
];

const languageOptions: { value: UserLanguagePreference; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'es', labelKey: 'settings.language.es' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isLoading, settings, setLanguage, setNotificationsEnabled, setTheme } = useSettings();
  const plan = settings?.plan ?? 'free';

  return (
    <ScreenScaffold
      eyebrow={t('settings.eyebrow')}
      title={t('settings.title')}
      description={t('settings.description')}>
      {isLoading || !settings ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.loading')}
        </ThemedText>
      ) : (
        <>
          <Section title={t('settings.preferences')}>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: settings.notificationsEnabled }}
              onPress={() => void setNotificationsEnabled(!settings.notificationsEnabled)}
              style={[
                styles.row,
                {
                  borderColor: settings.notificationsEnabled ? theme.borderStrong : theme.border,
                  backgroundColor: settings.notificationsEnabled ? theme.accentSoft : theme.surfaceSoft,
                },
              ]}>
              <View>
                <ThemedText type="smallBold">{t('settings.notifications')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('settings.notificationDetail')}
                </ThemedText>
              </View>
              <ThemedText
                type="smallBold"
                themeColor={settings.notificationsEnabled ? 'accentStrong' : 'textSecondary'}>
                {settings.notificationsEnabled ? t('common.on') : t('common.off')}
              </ThemedText>
            </Pressable>

            <View style={styles.segmentRow}>
              {themeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.theme === option.value }}
                  onPress={() => void setTheme(option.value)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor:
                        settings.theme === option.value ? theme.accentSoft : theme.backgroundSelected,
                      borderColor: settings.theme === option.value ? theme.borderStrong : theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    themeColor={settings.theme === option.value ? 'accentStrong' : 'textSecondary'}>
                    {t(option.labelKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title={t('settings.language.section')}>
            <View style={styles.segmentRow}>
              {languageOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.language === option.value }}
                  onPress={() => void setLanguage(option.value)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor:
                        settings.language === option.value ? theme.accentSoft : theme.backgroundSelected,
                      borderColor: settings.language === option.value ? theme.borderStrong : theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    themeColor={settings.language === option.value ? 'accentStrong' : 'textSecondary'}>
                    {t(option.labelKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title={t('settings.plan')}>
            <InfoRow label={t('settings.currentPlan')} value={plan} />
            <InfoRow label={t('settings.showAds')} value={AdsService.shouldShowAds(plan) ? t('common.yes') : t('common.no')} />
            <InfoRow
              label={t('settings.premiumStats')}
              value={EntitlementsService.canUseFeature(plan, 'advanced_stats') ? t('settings.premiumActive') : t('settings.premiumFuture')}
            />
            <DisabledAction label={t('settings.removeAds')} />
            <DisabledAction label={t('settings.premium')} />
            <DisabledAction label={t('settings.restorePurchases')} />
          </Section>

          <Section title={t('settings.information')}>
            <InfoRow label={t('settings.version')} value={Constants.expoConfig?.version ?? '1.0.0'} />
            <InfoRow label={t('settings.privacy')} value={settings.privacyPolicyUrl ?? t('settings.pending')} />
            <InfoRow label={t('settings.terms')} value={settings.termsUrl ?? t('settings.pending')} />
            <DisabledAction label={t('settings.sendFeedback')} />
            <DisabledAction label={t('settings.reportBugs')} />
          </Section>
        </>
      )}
    </ScreenScaffold>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="accentStrong">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

function DisabledAction({ label }: { label: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.disabledAction,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
      ]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label} · {t('common.future')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  segment: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  infoRow: {
    minHeight: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  disabledAction: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
