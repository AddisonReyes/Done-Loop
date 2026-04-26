type DashboardHeroProps = {
  completionRate: number;
  activeDays: number;
  todoCount: number;
};

type HeroStatProps = {
  label: string;
  value: string | number;
};

function HeroStat({ label, value }: HeroStatProps) {
  return (
    <div className="flex aspect-square min-h-[92px] flex-col rounded-2xl border border-white/7 bg-white/[0.035] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.045] sm:min-h-[104px] sm:p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </div>
      <div className="mt-auto text-[1.45rem] font-semibold leading-none text-white sm:text-[1.75rem]">
        {value}
      </div>
    </div>
  );
}

export function DashboardHero({
  completionRate,
  activeDays,
  todoCount,
}: DashboardHeroProps) {
  return (
    <section className="glass-panel float-in rounded-[28px] px-4 py-6 sm:px-7 sm:py-8">
      <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-200">
            Simple daily system
          </div>
          <h2 className="mt-4 max-w-[13ch] text-[1.95rem] font-semibold tracking-[-0.04em] text-white leading-[0.98] sm:mt-5 sm:text-[2.85rem] sm:leading-[1]">
            Minimal structure for habits and tasks.
          </h2>
          <p className="mt-3 max-w-[34rem] text-sm leading-6 text-zinc-300 sm:text-[0.98rem]">
            A focused, local-first dashboard with clean visual polish.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 self-start sm:min-w-[336px] sm:gap-3 lg:mb-2 lg:mr-4 lg:mt-auto lg:w-[336px] lg:self-end">
          <HeroStat label="Today" value={`${completionRate}%`} />
          <HeroStat label="Active days" value={activeDays} />
          <HeroStat label="Tasks" value={todoCount} />
        </div>
      </div>
    </section>
  );
}
