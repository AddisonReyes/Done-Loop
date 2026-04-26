import type { Habit } from "../lib/types";

type HabitTrackerSectionProps = {
  habits: Habit[];
  completedHabits: number;
  totalHabits: number;
  newHabitTitle: string;
  editingHabitId: string | null;
  editingHabitTitle: string;
  onNewHabitTitleChange: (value: string) => void;
  onEditingHabitTitleChange: (value: string) => void;
  onAddHabit: () => void;
  onToggleHabit: (habitId: string) => void;
  onStartEditHabit: (habit: Habit) => void;
  onSaveEditHabit: () => void;
  onCancelEditHabit: () => void;
  onDeleteHabit: (habitId: string) => void;
};

export function HabitTrackerSection({
  habits,
  completedHabits,
  totalHabits,
  newHabitTitle,
  editingHabitId,
  editingHabitTitle,
  onNewHabitTitleChange,
  onEditingHabitTitleChange,
  onAddHabit,
  onToggleHabit,
  onStartEditHabit,
  onSaveEditHabit,
  onCancelEditHabit,
  onDeleteHabit,
}: HabitTrackerSectionProps) {
  return (
    <section className="glass-panel float-in min-w-0 rounded-[28px] px-4 py-6 [animation-delay:240ms] sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Daily rituals
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Habit Tracker
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Check habits for today. They reset tomorrow.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
          {completedHabits}/{totalHabits} done
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={newHabitTitle}
          onChange={(event) => onNewHabitTitleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddHabit();
          }}
          placeholder="Add a habit (e.g. Read 10 min)"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-400/35 focus:ring-2 focus:ring-purple-500/40"
        />
        <button
          type="button"
          onClick={onAddHabit}
          className="h-11 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(147,51,234,0.16)] transition-all hover:-translate-y-0.5 hover:bg-purple-500 hover:shadow-[0_8px_18px_rgba(147,51,234,0.2)] focus:outline-none focus:ring-2 focus:ring-purple-500/55 sm:shrink-0"
        >
          Add habit
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {habits.length === 0 ? (
          <li className="rounded-[22px] border border-dashed border-white/10 bg-white/4 px-4 py-6 text-center text-sm text-zinc-400">
            Start with one tiny habit. The first check-in makes the page come
            alive.
          </li>
        ) : null}

        {habits.map((habit) => {
          const isEditing = editingHabitId === habit.id;

          return (
            <li
              key={habit.id}
              className={`group rounded-[22px] border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 ${
                habit.done
                  ? "border-purple-400/18 bg-purple-500/[0.07] hover:border-purple-400/24 hover:bg-purple-500/[0.09]"
                  : "border-white/8 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isEditing ? (
                  <div className="min-w-0 flex-1">
                    <input
                      value={editingHabitTitle}
                      onChange={(event) =>
                        onEditingHabitTitleChange(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onSaveEditHabit();
                        if (event.key === "Escape") onCancelEditHabit();
                      }}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none focus:border-purple-400/35 focus:ring-2 focus:ring-purple-500/35"
                      aria-label="Edit habit title"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    aria-pressed={habit.done}
                    aria-label={`Toggle ${habit.title}`}
                    className="group -mx-1 -my-1 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left focus:outline-none focus:ring-2 focus:ring-purple-500/55"
                  >
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                        habit.done
                          ? "border-purple-400/35 bg-purple-500/90 text-white"
                          : "border-white/12 bg-white/[0.04] text-transparent group-hover:border-white/18"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-medium transition-colors ${
                          habit.done
                            ? "text-zinc-300 line-through"
                            : "text-white"
                        }`}
                      >
                        {habit.title}
                      </span>
                    </span>
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={onSaveEditHabit}
                        className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.11] focus:outline-none focus:ring-2 focus:ring-purple-500/55"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEditHabit}
                        className="rounded-xl border border-white/8 bg-transparent px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/55"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                      <button
                      type="button"
                      onClick={() => onStartEditHabit(habit)}
                      className="flex-1 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/55 sm:flex-none"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteHabit(habit.id)}
                    className="flex-1 rounded-xl border border-white/8 bg-transparent px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-400/20 hover:bg-red-500/[0.05] hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-purple-500/55 sm:flex-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
