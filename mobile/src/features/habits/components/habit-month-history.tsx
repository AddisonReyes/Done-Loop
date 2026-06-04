import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

export type HabitDayActivity = 'none' | 'partial' | 'complete';

type HabitMonthHistoryProps = {
  monthLabel: string;
  days: { dateKey: string; dayNumber: number; activity: HabitDayActivity }[];
  monthlyMarkedDateKeys?: Set<string>;
  selectedDateKey?: string;
  onSelectDate?: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function HabitMonthHistory({
  monthLabel,
  monthlyMarkedDateKeys,
  selectedDateKey,
  days,
  onSelectDate,
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
          accessibilityLabel={t('calendar.previousMonth')}
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
          accessibilityLabel={t('calendar.nextMonth')}
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
          const monthlyMarked = monthlyMarkedDateKeys?.has(day.dateKey) ?? false;
          const selected = selectedDateKey === day.dateKey;
          const backgroundColor =
            day.activity === 'complete'
              ? theme.historyComplete
              : day.activity === 'partial'
                ? theme.historyPartial
                : theme.historyEmpty;
          const dayTextActive = day.activity !== 'none';

          return (
            <Pressable
              key={day.dateKey}
              accessibilityRole={onSelectDate ? 'button' : undefined}
              accessibilityState={onSelectDate ? { selected } : undefined}
              accessibilityLabel={t('habits.history.dayActivity', {
                date: day.dateKey,
                activity: t(`habits.history.${day.activity}`),
              })}
              disabled={!onSelectDate}
              onPress={() => onSelectDate?.(day.dateKey)}
              style={[
                styles.day,
                {
                  backgroundColor: selected && day.activity === 'none' ? theme.accentSoft : backgroundColor,
                  borderColor: selected
                    ? theme.accentStrong
                    : day.activity === 'none'
                      ? theme.border
                      : theme.borderStrong,
                  height: cellSize || undefined,
                  width: cellSize || undefined,
                },
              ]}>
              {monthlyMarked ? (
                <View
                  style={[
                    styles.monthlyMarker,
                    {
                      backgroundColor: theme.accentStrong,
                      borderColor: day.activity !== 'none' ? '#FFFFFF' : theme.backgroundElement,
                    },
                  ]}
                />
              ) : null}
              <ThemedText
                type="code"
                style={[
                  styles.dayNumber,
                  dayTextActive && styles.activeDayText,
                  selected && !dayTextActive && { color: theme.accentStrong },
                ]}>
                {day.dayNumber}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendDot label={t('habits.history.none')} color={theme.historyEmpty} borderColor={theme.border} />
        <LegendDot label={t('habits.history.partial')} color={theme.historyPartial} borderColor={theme.border} />
        <LegendDot label={t('habits.history.complete')} color={theme.historyComplete} borderColor={theme.border} />
      </View>
    </View>
  );
}

function LegendDot({ borderColor, label, color }: { borderColor: string; label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderColor }]} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.legendLabel}>
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
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  navButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  day: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthlyMarker: {
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    position: 'absolute',
    right: 5,
    top: 5,
    width: 10,
  },
  dayNumber: {
    textAlign: 'center',
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacing.one,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendLabel: {
    flexShrink: 1,
  },
});
