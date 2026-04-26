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
    <div className="flex aspect-square min-h-[104px] flex-col rounded-2xl border border-white/7 bg-white/[0.035] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.045]">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </div>
      <div className="mt-auto text-[1.75rem] font-semibold leading-none text-white">
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
    <section className="glass-panel float-in rounded-[28px] px-6 py-8 sm:px-7 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-200">
            Simple daily system
          </div>
          <h2 className="mt-5 max-w-[13ch] text-[2.3rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.85rem] sm:leading-[1]">
            Minimal structure for habits and tasks.
          </h2>
          <p className="mt-3 max-w-[34rem] text-sm leading-6 text-zinc-300 sm:text-[0.98rem]">
            A focused, local-first dashboard with clean visual polish.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 self-start sm:min-w-[336px] lg:mb-2 lg:mr-4 lg:self-end lg:w-[336px]">
          <HeroStat label="Today" value={`${completionRate}%`} />
          <HeroStat label="Active days" value={activeDays} />
          <HeroStat label="Tasks" value={todoCount} />
        </div>
      </div>
    </section>
  );
}
