import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

type TimePickerFieldProps = {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
};

function timeToDate(value?: string): Date {
  const date = new Date();
  const [hour = 9, minute = 0] = (value ?? '09:00').split(':').map(Number);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TimePickerField({ label, onChange, value }: TimePickerFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (date) {
      onChange(dateToTime(date));
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPicker(true)}
          style={[
            styles.button,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border },
          ]}>
          <ThemedText type="small">{value ?? t('common.none')}</ThemedText>
        </Pressable>
        {value ? (
          <Pressable accessibilityRole="button" onPress={() => onChange(undefined)} style={styles.clearButton}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('common.clear')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {showPicker ? (
        <DateTimePicker value={timeToDate(value)} mode="time" display="default" onChange={handleChange} />
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
    gap: Spacing.two,
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  clearButton: {
    justifyContent: 'center',
    minHeight: 48,
  },
});
