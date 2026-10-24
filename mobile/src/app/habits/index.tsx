import { useIsFocused } from 'expo-router';
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { HabitEditorModal } from "@/features/habits/components/habit-editor-modal";
import { HabitFilterTabs } from "@/features/habits/components/habit-filter-tabs";
import { HabitListItem } from "@/features/habits/components/habit-list-item";
import { HabitMonthHistory } from "@/features/habits/components/habit-month-history";
import { useHabits } from "@/features/habits/hooks/use-habits";
import type { Habit } from "@/features/habits/types";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { AnimatedListItem } from "@/shared/components/animated-list-item";
import { EmptyState } from "@/shared/components/empty-state";
import { FloatingCreateButton } from "@/shared/components/floating-create-button";
import { SectionCard } from "@/shared/components/section-card";
import { VirtualizedScreenScaffold } from "@/shared/components/virtualized-screen-scaffold";
import { formatDateKey } from "@/shared/utils/date";

const animatedListItemLimit = 24;

export default function HabitsScreen() {
  const isFocused = useIsFocused();
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const [selectedDateKey, setSelectedDateKey] = useState<string | undefined>();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const {
    createHabitFromDraft,
    deleteHabit,
    errorMessage,
    filter,
    getCompletedHabitIdsForDate,
    getHabitsForDate,
    goToNextMonth,
    goToPreviousMonth,
    isLoading,
    monthHistoryDays,
    monthLabel,
    monthlyHabitDateKeys,
    setFilter,
    todayKey,
    toggleCompletionForDate,
    visibleHabits,
    updateHabitFromDraft,
    habits,
  } = useHabits({ isFocused });
  const hasSelectedDateFilter = !!selectedDateKey;
  const listedDateKey = selectedDateKey ?? todayKey;
  const listedHabitsDue = useMemo(
    () => getHabitsForDate(listedDateKey),
    [getHabitsForDate, listedDateKey],
  );
  const selectedHabits = useMemo(
    () => (selectedDateKey ? listedHabitsDue : []),
    [listedHabitsDue, selectedDateKey],
  );
  const completedHabitIdsForListedDate = useMemo(
    () => getCompletedHabitIdsForDate(listedDateKey),
    [getCompletedHabitIdsForDate, listedDateKey],
  );
  const listedHabits = useMemo(() => {
    if (!hasSelectedDateFilter) {
      return visibleHabits;
    }

    if (filter === "completedToday") {
      return listedHabitsDue.filter((habit) =>
        completedHabitIdsForListedDate.has(habit.id),
      );
    }

    if (filter === "pendingToday") {
      return listedHabitsDue.filter(
        (habit) => !completedHabitIdsForListedDate.has(habit.id),
      );
    }

    return selectedHabits;
  }, [
    completedHabitIdsForListedDate,
    filter,
    hasSelectedDateFilter,
    listedHabitsDue,
    selectedHabits,
    visibleHabits,
  ]);
  const dueHabitIdsForListedDate = useMemo(() => {
    if (hasSelectedDateFilter) {
      return new Set(listedHabitsDue.map((habit) => habit.id));
    }

    return new Set(listedHabitsDue.map((habit) => habit.id));
  }, [hasSelectedDateFilter, listedHabitsDue]);
  const totalCompletedForListedDate = useMemo(
    () => listedHabitsDue.filter((habit) => completedHabitIdsForListedDate.has(habit.id)).length,
    [completedHabitIdsForListedDate, listedHabitsDue],
  );
  const pendingForListedDate = listedHabitsDue.length - totalCompletedForListedDate;

  const selectedDateEmptyMessage =
    hasSelectedDateFilter && selectedHabits.length === 0
      ? "calendar.noHabitsForDay"
      : "habits.emptyFilter";

  const listedStatusLabel = useCallback(
    (habit: Habit) => {
      if (!habit.isActive && !habit.deletedAt) {
        return t("habits.archived");
      }

      if (!dueHabitIdsForListedDate.has(habit.id)) {
        return t("habits.notScheduledToday");
      }

      if (!hasSelectedDateFilter || listedDateKey === todayKey) {
        return undefined;
      }

      return completedHabitIdsForListedDate.has(habit.id)
        ? t("habits.completed")
        : t("habits.pending");
    },
    [
      completedHabitIdsForListedDate,
      dueHabitIdsForListedDate,
      hasSelectedDateFilter,
      listedDateKey,
      t,
      todayKey,
    ],
  );

  const handleToggleHabit = useCallback(
    (habitId: string) => {
      if (!dueHabitIdsForListedDate.has(habitId)) {
        return;
      }

      void toggleCompletionForDate(habitId, listedDateKey);
    },
    [dueHabitIdsForListedDate, listedDateKey, toggleCompletionForDate],
  );

  const selectedDateLabel = selectedDateKey
    ? formatDateKey(selectedDateKey, locale, "long")
    : "";

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey((current) =>
      current === dateKey ? undefined : dateKey,
    );
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setSelectedDateKey(undefined);
    goToPreviousMonth();
  }, [goToPreviousMonth]);

  const handleNextMonth = useCallback(() => {
    setSelectedDateKey(undefined);
    goToNextMonth();
  }, [goToNextMonth]);

  const confirmDeleteHabit = useCallback((habit: Habit) => {
    Alert.alert(t("habits.deleteConfirmTitle"), t("habits.deleteConfirmMessage"), [
      { text: t("habits.cancel"), style: "cancel" },
      {
        text: t("habits.deleteFromDate"),
        style: "destructive",
        onPress: () => {
          void deleteHabit(habit.id, { mode: "fromDate", effectiveDateKey: listedDateKey });
        },
      },
      {
        text: t("habits.deleteAllHistory"),
        style: "destructive",
        onPress: () => {
          void deleteHabit(habit.id, { mode: "allHistory", effectiveDateKey: listedDateKey });
        },
      },
    ]);
  }, [deleteHabit, listedDateKey, t]);

  const listHeader = (
    <>
      <View style={styles.summary}>
        <View
          style={[
            styles.summaryItem,
            {
              backgroundColor: theme.accentSoft,
              borderColor: theme.borderStrong,
            },
          ]}
        >
          <ThemedText type="subtitle" style={styles.summaryNumber}>
            {totalCompletedForListedDate}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("habits.completedSummary")}
          </ThemedText>
        </View>
        <View
          style={[
            styles.summaryItem,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          <ThemedText type="subtitle" style={styles.summaryNumber}>
            {pendingForListedDate}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("habits.pendingSummary")}
          </ThemedText>
        </View>
      </View>

      <SectionCard>
        <HabitFilterTabs value={filter} onChange={setFilter} />
      </SectionCard>

      <View style={styles.calendarSection}>
        <ThemedText type="smallBold" themeColor="accentStrong">
          {t("calendar.habits")}
        </ThemedText>
        <HabitMonthHistory
          monthLabel={monthLabel}
          days={monthHistoryDays}
          monthlyMarkedDateKeys={monthlyHabitDateKeys}
          selectedDateKey={selectedDateKey}
          onSelectDate={handleSelectDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
      </View>

      {selectedDateKey ? (
        <View
          style={[
            styles.selectedDayContainer,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          <ThemedText
            type="smallBold"
            themeColor="accentStrong"
            style={styles.selectedDayText}
          >
            {t("calendar.selectedDay", { date: selectedDateLabel })}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.clearSelection")}
            onPress={() => setSelectedDateKey(undefined)}
            style={[
              styles.clearButton,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t("common.clear")}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {errorMessage ? (
        <ThemedText type="small" themeColor="warning">
          {errorMessage}
        </ThemedText>
      ) : null}

      {isLoading ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t("habits.loading")}
        </ThemedText>
      ) : null}

      {!isLoading && habits.length === 0 ? (
        <EmptyState
          message={t("habits.empty")}
          actionLabel={t("habits.create")}
          onAction={() => setIsCreateModalVisible(true)}
        />
      ) : null}

      {!isLoading && habits.length > 0 && listedHabits.length === 0 ? (
        <EmptyState message={t(selectedDateEmptyMessage)} />
      ) : null}
    </>
  );

  const renderHabit = useCallback(
    ({ item, index }: { item: Habit; index: number }) => (
      <View>
        <AnimatedListItem
          animate={index < animatedListItemLimit}
          delay={index * 18}
        >
          <HabitListItem
            habit={item}
            completedToday={completedHabitIdsForListedDate.has(item.id)}
            completionDisabled={!item.isActive || !dueHabitIdsForListedDate.has(item.id)}
            statusLabel={listedStatusLabel(item)}
            onToggleToday={() => {
              handleToggleHabit(item.id);
            }}
            onStartEdit={() => setEditingHabit(item)}
            onDelete={() => confirmDeleteHabit(item)}
          />
        </AnimatedListItem>
      </View>
    ),
    [
      completedHabitIdsForListedDate,
      confirmDeleteHabit,
      dueHabitIdsForListedDate,
      handleToggleHabit,
      listedStatusLabel,
    ],
  );

  return (
    <View style={styles.screen}>
      <VirtualizedScreenScaffold
        isFocused={isFocused}
        title={t("habits.title")}
        data={listedHabits}
        keyExtractor={(habit) => habit.id}
        listHeader={listHeader}
        renderItem={renderHabit}
      />
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
          if (
            editingHabit &&
            (await updateHabitFromDraft(editingHabit.id, draft))
          ) {
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  summaryItem: {
    flexBasis: "48%",
    flex: 1,
    minHeight: 92,
    minWidth: 136,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
    justifyContent: "center",
  },
  summaryNumber: {
    fontSize: 28,
    lineHeight: 34,
    minWidth: 0,
  },
  calendarSection: {
    gap: Spacing.two,
  },
  selectedDayContainer: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    justifyContent: "space-between",
    minHeight: 64,
    padding: Spacing.three,
  },
  selectedDayText: {
    flex: 1,
    minWidth: 0,
  },
  clearButton: {
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
});
