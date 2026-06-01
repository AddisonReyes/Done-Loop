import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccentColors, Spacing } from '@/constants/theme';
import { useSettings } from '@/features/settings/hooks/use-settings';
import type {
  UserAccentColorPreference,
  UserDateFormatPreference,
  UserLanguagePreference,
  UserThemePreference,
} from '@/features/settings/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { DropdownSelect } from '@/shared/components/dropdown-select';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';
import { SectionCard } from '@/shared/components/section-card';
import { SegmentedControl } from '@/shared/components/segmented-control';

const themeOptions: { value: UserThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.theme.system' },
  { value: 'light', labelKey: 'settings.theme.light' },
  { value: 'dark', labelKey: 'settings.theme.dark' },
];

const languageOptions: { value: UserLanguagePreference; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'es', labelKey: 'settings.language.es' },
];

const dateFormatOptions: { value: UserDateFormatPreference; labelKey: string }[] = [
  { value: 'iso', labelKey: 'settings.dateFormat.iso' },
  { value: 'mdy', labelKey: 'settings.dateFormat.mdy' },
  { value: 'dmy', labelKey: 'settings.dateFormat.dmy' },
  { value: 'long', labelKey: 'settings.dateFormat.long' },
];

const accentColorOptions: { value: UserAccentColorPreference; labelKey: string }[] = [
  { value: 'purple', labelKey: 'settings.accentColor.purple' },
  { value: 'blue', labelKey: 'settings.accentColor.blue' },
  { value: 'green', labelKey: 'settings.accentColor.green' },
  { value: 'red', labelKey: 'settings.accentColor.red' },
  { value: 'yellow', labelKey: 'settings.accentColor.yellow' },
  { value: 'pink', labelKey: 'settings.accentColor.pink' },
];

const SourceCodeUrl = 'https://github.com/AddisonReyes/done-loop';
const SourceCodeLabel = 'AddisonReyes/done-loop';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    isLoading,
    settings,
    setAccentColor,
    setDateFormat,
    setLanguage,
    setNotificationsEnabled,
    setTheme,
  } = useSettings();
  return (
    <ScreenScaffold title={t('settings.title')}>
      {isLoading || !settings ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.loading')}
        </ThemedText>
      ) : (
        <>
          <SectionCard title={t('settings.preferences')}>
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
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(enabled) => void setNotificationsEnabled(enabled)}
              />
            </Pressable>
          </SectionCard>

          <SectionCard title={t('settings.customization')}>
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('settings.theme.section')}</ThemedText>
              <SegmentedControl
                value={settings.theme}
                onChange={(value) => void setTheme(value)}
                options={themeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('settings.accentColor.section')}</ThemedText>
              <View style={styles.colorGrid}>
                {accentColorOptions.map((option) => (
                  <AccentColorOption
                    key={option.value}
                    label={t(option.labelKey)}
                    selected={settings.accentColor === option.value}
                    value={option.value}
                    onSelect={() => void setAccentColor(option.value)}
                  />
                ))}
              </View>
            </View>
          </SectionCard>

          <SectionCard title={t('settings.language.section')}>
            <SegmentedControl
              value={settings.language}
              onChange={(value) => void setLanguage(value)}
              options={languageOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
            />
          </SectionCard>

          <SectionCard title={t('settings.dateFormat.section')}>
            <DropdownSelect
              label={t('settings.dateFormat.section')}
              value={settings.dateFormat}
              onChange={(value) => void setDateFormat(value)}
              options={dateFormatOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
            />
          </SectionCard>

          <SectionCard title={t('settings.information')}>
            <InfoRow label={t('settings.version')} value={Constants.expoConfig?.version ?? '1.0.0'} />
            <LinkInfoRow
              label={t('settings.privacy')}
              value={settings.privacyPolicyUrl}
              displayValue={t('settings.privacyPolicy')}
            />
            <LinkInfoRow
              label={t('settings.terms')}
              value={settings.termsUrl}
              displayValue={t('settings.termsOfService')}
            />
            <LinkInfoRow label={t('settings.sourceCode')} value={SourceCodeUrl} displayValue={SourceCodeLabel} />
          </SectionCard>
        </>
      )}
    </ScreenScaffold>
  );
}

function AccentColorOption({
  label,
  onSelect,
  selected,
  value,
}: {
  label: string;
  onSelect: () => void;
  selected: boolean;
  value: UserAccentColorPreference;
}) {
  const theme = useTheme();
  const swatchColor = AccentColors.dark[value].accent;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[
        styles.colorOption,
        {
          backgroundColor: selected ? theme.accentSoft : theme.surfaceSoft,
          borderColor: selected ? theme.borderStrong : theme.border,
        },
      ]}>
      <View style={[styles.swatch, { backgroundColor: swatchColor }]}>
        {selected ? <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" /> : null}
      </View>
      <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'} style={styles.colorLabel}>
        {label}
      </ThemedText>
    </Pressable>
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

function LinkInfoRow({
  displayValue,
  label,
  value,
}: {
  displayValue?: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  const visibleValue = displayValue ?? value;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${visibleValue}`}
      onPress={() => {
        void Linking.openURL(value);
      }}
      style={({ pressed }) => [styles.infoRow, pressed && styles.pressedRow]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={[styles.linkValue, { color: theme.accentStrong }]}>
        {visibleValue}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  infoRow: {
    minHeight: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressedRow: {
    opacity: 0.72,
  },
  linkValue: {
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  colorOption: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    gap: Spacing.one,
    minHeight: 76,
    minWidth: 92,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  colorLabel: {
    textAlign: 'center',
  },
});
