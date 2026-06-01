import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HabitEditorModal } from '@/features/habits/components/habit-editor-modal';
import { HabitFilterTabs } from '@/features/habits/components/habit-filter-tabs';
import { HabitListItem } from '@/features/habits/components/habit-list-item';
import { HabitMonthHistory } from '@/features/habits/components/habit-month-history';
import { useHabits } from '@/features/habits/hooks/use-habits';
import type { Habit } from '@/features/habits/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { FloatingCreateButton } from '@/shared/components/floating-create-button';
import { EmptyState } from '@/shared/components/empty-state';
import { SectionCard } from '@/shared/components/section-card';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function HabitsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const {
    completedHabitIds,
    createHabitFromDraft,
    deleteHabit,
    errorMessage,
    filter,
    goToNextMonth,
    goToPreviousMonth,
    isLoading,
    monthHistoryDays,
    monthLabel,
    pendingCount,
    setFilter,
    toggleTodayCompletion,
    totalCompletedToday,
    visibleHabits,
    habits,
    updateHabitFromDraft,
  } = useHabits();

  return (
    <View style={styles.screen}>
      <ScreenScaffold title={t('habits.title')}>
        <View style={styles.summary}>
          <View
            style={[
              styles.summaryItem,
              { backgroundColor: theme.accentSoft, borderColor: theme.borderStrong },
            ]}>
            <ThemedText type="subtitle" style={styles.summaryNumber}>
              {totalCompletedToday}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('habits.completedSummary')}
            </ThemedText>
          </View>
          <View
            style={[
              styles.summaryItem,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
            ]}>
            <ThemedText type="subtitle" style={styles.summaryNumber}>
              {pendingCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('habits.pendingSummary')}
            </ThemedText>
          </View>
        </View>

        <SectionCard>
          <HabitFilterTabs value={filter} onChange={setFilter} />
        </SectionCard>

        <SectionCard title={t('calendar.habits')}>
          <HabitMonthHistory
            monthLabel={monthLabel}
            days={monthHistoryDays}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />
        </SectionCard>

        {errorMessage ? (
          <ThemedText type="small" themeColor="warning">
            {errorMessage}
          </ThemedText>
        ) : null}

        {isLoading ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('habits.loading')}
          </ThemedText>
        ) : null}

        {!isLoading && habits.length === 0 ? (
          <EmptyState
            message={t('habits.empty')}
            actionLabel={t('habits.create')}
            onAction={() => setIsCreateModalVisible(true)}
          />
        ) : null}

        {!isLoading && habits.length > 0 && visibleHabits.length === 0 ? (
          <EmptyState message={t('habits.emptyFilter')} />
        ) : null}

        <View style={styles.list}>
          {visibleHabits.map((habit) => (
            <HabitListItem
              key={habit.id}
              habit={habit}
              completedToday={completedHabitIds.has(habit.id)}
              onToggleToday={() => {
                void toggleTodayCompletion(habit.id);
              }}
              onStartEdit={() => setEditingHabit(habit)}
              onDelete={() => {
                void deleteHabit(habit.id);
              }}
            />
          ))}
        </View>
      </ScreenScaffold>
      <HabitEditorModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={async (draft) => {
          if (await createHabitFromDraft(draft)) {
            setIsCreateModalVisible(false);
          }
        }}
      />
      <HabitEditorModal
        habit={editingHabit}
        visible={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={async (draft) => {
          if (editingHabit && (await updateHabitFromDraft(editingHabit.id, draft))) {
            setEditingHabit(null);
          }
        }}
      />
      <FloatingCreateButton onPress={() => setIsCreateModalVisible(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryItem: {
    flex: 1,
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    lineHeight: 34,
  },
  list: {
    gap: Spacing.two,
  },
});
