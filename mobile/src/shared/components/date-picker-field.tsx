import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { dateKeyToLocalDate, formatDateKey, toDateKey } from '@/shared/utils/date';

type DatePickerFieldProps = {
  label: string;
  value?: string;
  dateFormat: 'iso' | 'mdy' | 'dmy' | 'long';
  onChange: (value?: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  clearable?: boolean;
  hideLabel?: boolean;
};

export function DatePickerField({
  clearable = true,
  dateFormat,
  hideLabel = false,
  label,
  maximumDate,
  minimumDate,
  onChange,
  value,
}: DatePickerFieldProps) {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = dateKeyToLocalDate(value ?? '') ?? new Date();
  const displayValue = value ? formatDateKey(value, locale, dateFormat) : t('common.none');

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (date) {
      onChange(toDateKey(date));
    }
  };

  return (
    <View style={styles.container}>
      {!hideLabel ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={`${label}: ${displayValue}`}
          accessibilityRole="button"
          onPress={() => setShowPicker(true)}
          style={[
            styles.button,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border },
          ]}>
          <ThemedText type="small" style={styles.buttonLabel}>
            {displayValue}
          </ThemedText>
        </Pressable>
        {clearable && value ? (
          <Pressable
            accessibilityLabel={`${t('common.clear')} ${label}`}
            accessibilityRole="button"
            onPress={() => onChange(undefined)}
            style={styles.clearButton}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('common.clear')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          accentColor={theme.accent}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: Spacing.three,
  },
  buttonLabel: {
    flexShrink: 1,
  },
  clearButton: {
    justifyContent: 'center',
    minHeight: 48,
  },
});
