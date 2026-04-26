import { levelClass, levelLabel } from "../lib/habits";
import type { HistoryDay } from "../lib/types";

type HabitHistorySectionProps = {
  monthLabel: string;
  activeDays: number;
  consistencyRate: number;
  displayedDay: HistoryDay | null;
  historyWeeks: HistoryDay[][];
  onInspectDay: (dayKey: string | null) => void;
};

export function HabitHistorySection({
  monthLabel,
  activeDays,
  consistencyRate,
  displayedDay,
  historyWeeks,
  onInspectDay,
}: HabitHistorySectionProps) {
  return (
    <section className="mt-6 glass-panel float-in rounded-[26px] px-4 py-6 [animation-delay:120ms] sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Monthly activity
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Habit History
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {monthLabel}. Today stays highlighted inside the month view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
            {activeDays} active days
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
            {consistencyRate}% consistency
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/8 bg-black/18 px-3 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Activity</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-3.5 w-3.5 rounded-[4px] border ${levelClass(level)}`}
              />
            ))}
          </div>
          <div className="text-xs text-zinc-400 sm:text-right">
            {displayedDay
              ? displayedDay.isToday
                ? `Today · ${levelLabel(displayedDay.level)}`
                : displayedDay.label
              : monthLabel}
          </div>
        </div>

        <div className="mt-5 max-w-full overflow-x-auto py-2">
          <div className="flex w-fit min-w-full gap-3 px-1 pb-1 sm:mx-auto sm:min-w-0">
            {historyWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-2">
                <div className="pl-0.5 text-[11px] font-medium text-zinc-500">
                  {week[0]?.dayNumber}
                </div>
                <div className="flex gap-1">
                  {week.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onMouseEnter={() => onInspectDay(day.key)}
                      onFocus={() => onInspectDay(day.key)}
                      onMouseLeave={() => onInspectDay(null)}
                      onBlur={() => onInspectDay(null)}
                      aria-label={`${day.label}: ${levelLabel(day.level)}`}
                      className={`h-5 w-5 shrink-0 rounded-[6px] border transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400/35 ${levelClass(
                        day.level,
                      )} ${
                        day.isToday
                          ? "shadow-[inset_0_0_0_1px_rgba(233,213,255,0.75),0_0_0_1px_rgba(168,85,247,0.28),0_0_16px_rgba(168,85,247,0.16)]"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
