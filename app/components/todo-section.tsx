import type { TodoItem } from "../lib/types";

type TodoSectionProps = {
  todos: TodoItem[];
  newTodoText: string;
  onNewTodoTextChange: (value: string) => void;
  onAddTodo: () => void;
  onDeleteTodo: (todoId: string) => void;
};

export function TodoSection({
  todos,
  newTodoText,
  onNewTodoTextChange,
  onAddTodo,
  onDeleteTodo,
}: TodoSectionProps) {
  return (
    <section className="glass-panel float-in min-w-0 rounded-[28px] px-4 py-6 [animation-delay:300ms] sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Clear the queue
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Todo</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Completing an item removes it instantly.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
          {todos.length} open
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={newTodoText}
          onChange={(event) => onNewTodoTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddTodo();
          }}
          placeholder="Add a todo"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-400/35 focus:ring-2 focus:ring-purple-500/40"
        />
        <button
          type="button"
          onClick={onAddTodo}
          className="h-11 rounded-xl bg-white/8 px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-purple-500/70 sm:shrink-0"
        >
          Add task
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {todos.length === 0 ? (
          <li className="rounded-[22px] border border-dashed border-white/10 bg-white/4 px-4 py-6 text-center text-sm text-zinc-400">
            Nothing pending. Use this space for the few tasks that must happen
            today.
          </li>
        ) : null}

        {todos.map((todo, index) => (
          <li
            key={todo.id}
            className="overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.05]"
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/6 text-xs font-semibold text-zinc-300">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {todo.text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteTodo(todo.id)}
                className="self-end rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(147,51,234,0.14)] transition-all hover:-translate-y-0.5 hover:bg-purple-500 hover:shadow-[0_8px_18px_rgba(147,51,234,0.18)] focus:outline-none focus:ring-2 focus:ring-purple-500/55 sm:ml-auto sm:shrink-0 sm:self-auto"
              >
                Done
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
