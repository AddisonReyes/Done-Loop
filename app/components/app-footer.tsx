export function AppFooter() {
  return (
    <footer className="mt-8 border-t border-white/7 text-xs text-zinc-600">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="text-zinc-600">
            Copyright (c) {new Date().getFullYear()} EasyToDo. All rights
            reserved.
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div>Stored locally in your browser.</div>
            <a
              href="https://addisonreyes.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-purple-300/90 transition-colors hover:text-purple-200"
            >
              Made by Addison Reyes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
