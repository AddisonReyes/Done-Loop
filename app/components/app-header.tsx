type AppHeaderProps = {
  monthLabel: string;
};

export function AppHeader({ monthLabel }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-zinc-950/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            EasyToDo
          </h1>
          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Habits reset daily. Todos disappear when completed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
            Local-first
          </div>
          <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">
            {monthLabel}
          </div>
        </div>
      </div>
    </header>
  );
}
