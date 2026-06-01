import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

export type HabitDayActivity = 'none' | 'partial' | 'complete';

type HabitMonthHistoryProps = {
  monthLabel: string;
  days: { dateKey: string; dayNumber: number; activity: HabitDayActivity }[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function HabitMonthHistory({
  monthLabel,
  days,
  onPreviousMonth,
  onNextMonth,
}: HabitMonthHistoryProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [gridWidth, setGridWidth] = useState(0);
  const cellGap = Spacing.one;
  const cellSize = gridWidth > 0 ? Math.floor((gridWidth - cellGap * 6) / 7) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onPreviousMonth}
          style={[styles.navButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="accentStrong">
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.monthLabel}>
          {monthLabel}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={onNextMonth}
          style={[styles.navButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="accentStrong">
            ›
          </ThemedText>
        </Pressable>
      </View>

      <View
        style={[styles.grid, { gap: cellGap }]}
        onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
        {days.map((day) => {
          const backgroundColor =
            day.activity === 'complete'
              ? theme.historyComplete
              : day.activity === 'partial'
                ? theme.historyPartial
                : theme.historyEmpty;

          return (
            <ThemedView
              key={day.dateKey}
              accessibilityLabel={t('habits.history.dayActivity', {
                date: day.dateKey,
                activity: t(`habits.history.${day.activity}`),
              })}
              style={[
                styles.day,
                {
                  backgroundColor,
                  borderColor: day.activity === 'none' ? theme.border : theme.borderStrong,
                  height: cellSize || undefined,
                  width: cellSize || undefined,
                },
              ]}>
              <ThemedText
                type="code"
                style={[styles.dayNumber, day.activity !== 'none' && styles.activeDayText]}>
                {day.dayNumber}
              </ThemedText>
            </ThemedView>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendDot label={t('habits.history.none')} color={theme.historyEmpty} />
        <LegendDot label={t('habits.history.partial')} color={theme.historyPartial} />
        <LegendDot label={t('habits.history.complete')} color={theme.historyComplete} />
      </View>
    </View>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    textAlign: 'center',
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
