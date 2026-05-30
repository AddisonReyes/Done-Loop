import Constants from 'expo-constants';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AdsService } from '@/features/monetization/ads/ads-service';
import { EntitlementsService } from '@/features/monetization/entitlements/entitlements-service';
import { useSettings } from '@/features/settings/hooks/use-settings';
import type { UserThemePreference } from '@/features/settings/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

const themeOptions: { value: UserThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { isLoading, settings, setNotificationsEnabled, setTheme } = useSettings();
  const plan = settings?.plan ?? 'free';

  return (
    <ScreenScaffold
      eyebrow="Producto"
      title="Ajustes"
      description="Preferencias locales, estado del plan e información necesaria para preparar Done Loop como producto real.">
      {isLoading || !settings ? (
        <ThemedText type="small" themeColor="textSecondary">
          Cargando ajustes...
        </ThemedText>
      ) : (
        <>
          <Section title="Preferencias">
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
                <ThemedText type="smallBold">Notificaciones</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Recordatorios locales para hábitos y tareas
                </ThemedText>
              </View>
              <ThemedText
                type="smallBold"
                themeColor={settings.notificationsEnabled ? 'accentStrong' : 'textSecondary'}>
                {settings.notificationsEnabled ? 'On' : 'Off'}
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
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Plan">
            <InfoRow label="Plan actual" value={plan} />
            <InfoRow label="Mostrar ads" value={AdsService.shouldShowAds(plan) ? 'Si' : 'No' } />
            <InfoRow
              label="Estadísticas premium"
              value={EntitlementsService.canUseFeature(plan, 'advanced_stats') ? 'Activas' : 'Futuro'}
            />
            <DisabledAction label="Quitar anuncios" />
            <DisabledAction label="Premium" />
            <DisabledAction label="Restaurar compras" />
          </Section>

          <Section title="Información">
            <InfoRow label="Versión" value={Constants.expoConfig?.version ?? '1.0.0'} />
            <InfoRow label="Privacidad" value={settings.privacyPolicyUrl ?? 'Pendiente'} />
            <InfoRow label="Términos" value={settings.termsUrl ?? 'Pendiente'} />
            <DisabledAction label="Enviar feedback" />
            <DisabledAction label="Reportar errores" />
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
  return (
    <View
      style={[
        styles.disabledAction,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
      ]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label} · futuro
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
