"use client";

import { AppFooter } from "./components/app-footer";
import { AppHeader } from "./components/app-header";
import { DashboardHero } from "./components/dashboard-hero";
import { HabitHistorySection } from "./components/habit-history-section";
import { HabitTrackerSection } from "./components/habit-tracker-section";
import { LoadingShell } from "./components/loading-shell";
import { TodoSection } from "./components/todo-section";
import { useEasyToDoApp } from "./hooks/use-easy-to-do-app";

export default function Home() {
  const {
    mounted,
    monthLabel,
    habits,
    todos,
    completionRate,
    activeDays,
    consistencyRate,
    completedHabits,
    totalHabits,
    historyWeeks,
    displayedHistoryDay,
    newHabitTitle,
    setNewHabitTitle,
    editingHabitId,
    editingHabitTitle,
    setEditingHabitTitle,
    newTodoText,
    setNewTodoText,
    setInspectedHistoryKey,
    addHabit,
    toggleHabit,
    startEditHabit,
    saveEditHabit,
    cancelEditHabit,
    deleteHabit,
    addTodo,
    deleteTodo,
  } = useEasyToDoApp();

  if (!mounted) {
    return <LoadingShell />;
  }

  return (
    <div className="min-h-dvh flex flex-col text-zinc-100">
      <AppHeader monthLabel={monthLabel} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <DashboardHero
          completionRate={completionRate}
          activeDays={activeDays}
          todoCount={todos.length}
        />

        <HabitHistorySection
          monthLabel={monthLabel}
          activeDays={activeDays}
          consistencyRate={consistencyRate}
          displayedDay={displayedHistoryDay}
          historyWeeks={historyWeeks}
          onInspectDay={setInspectedHistoryKey}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:[&>*]:min-w-0">
          <HabitTrackerSection
            habits={habits}
            completedHabits={completedHabits}
            totalHabits={totalHabits}
            newHabitTitle={newHabitTitle}
            editingHabitId={editingHabitId}
            editingHabitTitle={editingHabitTitle}
            onNewHabitTitleChange={setNewHabitTitle}
            onEditingHabitTitleChange={setEditingHabitTitle}
            onAddHabit={addHabit}
            onToggleHabit={toggleHabit}
            onStartEditHabit={startEditHabit}
            onSaveEditHabit={saveEditHabit}
            onCancelEditHabit={cancelEditHabit}
            onDeleteHabit={deleteHabit}
          />

          <TodoSection
            todos={todos}
            newTodoText={newTodoText}
            onNewTodoTextChange={setNewTodoText}
            onAddTodo={addTodo}
            onDeleteTodo={deleteTodo}
          />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
