import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { addMonths, dateKeyToLocalDate, formatDateKey, formatMonthLabel, getMonthDateKeys, startOfMonth, toDateKey } from '@/shared/utils/date';

type DatePickerFieldProps = {
  label: string;
  value?: string;
  dateFormat: 'iso' | 'mdy' | 'dmy' | 'long';
  onChange: (value?: string) => void;
};

export function DatePickerField({ dateFormat, label, onChange, value }: DatePickerFieldProps) {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = dateKeyToLocalDate(value ?? '') ?? new Date();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(selectedDate));
  const displayValue = value ? formatDateKey(value, locale, dateFormat) : t('common.none');
  const monthDays = useMemo(() => getMonthDateKeys(displayedMonth), [displayedMonth]);
  const leadingBlankDays = useMemo(() => {
    const firstDay = displayedMonth.getDay();
    return Array.from({ length: firstDay });
  }, [displayedMonth]);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (date) {
      onChange(toDateKey(date));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPicker((current) => !current)}
          style={[
            styles.button,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border },
          ]}>
          <ThemedText type="small">{displayValue}</ThemedText>
        </Pressable>
        {showPicker ? (
          <View style={[styles.calendar, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDisplayedMonth((current) => addMonths(current, -1))}
                style={styles.navButton}>
                <ThemedText type="smallBold" themeColor="accentStrong">
                  ‹
                </ThemedText>
              </Pressable>
              <ThemedText type="smallBold">{formatMonthLabel(displayedMonth, locale)}</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDisplayedMonth((current) => addMonths(current, 1))}
                style={styles.navButton}>
                <ThemedText type="smallBold" themeColor="accentStrong">
                  ›
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {leadingBlankDays.map((_, index) => (
                <View key={`blank-${index}`} style={styles.calendarDay} />
              ))}
              {monthDays.map((dateKey) => {
                const selected = dateKey === value;
                return (
                  <Pressable
                    key={dateKey}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(dateKey);
                      setShowPicker(false);
                    }}
                    style={[
                      styles.calendarDay,
                      {
                        backgroundColor: selected ? theme.accent : theme.backgroundSelected,
                        borderColor: selected ? theme.borderStrong : theme.border,
                      },
                    ]}>
                    <ThemedText type="code" style={selected && styles.selectedDayText}>
                      {Number(dateKey.slice(8, 10))}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {value ? (
              <Pressable accessibilityRole="button" onPress={() => onChange(undefined)} style={styles.clearWebButton}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {t('common.clear')}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

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
          <ThemedText type="small">{displayValue}</ThemedText>
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
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleChange} />
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
  calendar: {
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.two,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  calendarDay: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    width: 38,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  clearWebButton: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
});
