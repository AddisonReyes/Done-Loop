# Repository Guidelines

These instructions apply to the whole repository. More specific `AGENTS.md` files inside subdirectories add project-specific rules for that area.

## Engineering Standards

- Follow sound software engineering practices: small cohesive changes, clear boundaries, typed interfaces, and predictable behavior.
- Write clean code that is easy to read, maintain, test, and extend.
- Prefer simple, explicit solutions over clever abstractions.
- Keep files, functions, components, hooks, and modules well structured and organized around their responsibility.
- Avoid mixing unrelated concerns in the same change.
- Preserve existing architecture and local patterns unless there is a strong reason to improve them.

## Code Quality

- Use meaningful names for variables, functions, components, types, and files.
- Keep functions focused; extract helpers only when they reduce real complexity or duplication.
- Avoid dead code, unused exports, broad casts, and hidden side effects.
- Do not weaken TypeScript or lint rules to make errors disappear.
- Add comments only when they clarify non-obvious behavior or important intent.
- Keep UI code accessible, responsive, and consistent with the existing design system.

## Project Awareness

- The current product focus is the Expo React Native app in `mobile/`.
- The `frontend/` directory contains a legacy Next.js implementation.
- Read the nearest `AGENTS.md`, package scripts, configs, and existing code before making changes.
- Use the repository's existing dependencies and patterns before introducing new ones.
- Do not change app identity, native configuration, storage schemas, or migrations casually.

## Data And Persistence

- Treat stored data as user-owned. When changing persisted shapes, add safe migrations or compatibility handling.
- Keep migrations deterministic and idempotent where possible.
- Validate data at boundaries and avoid assuming old local data is perfectly shaped.

## Validation

- Run the most relevant checks for the files changed.
- For mobile changes, prefer:
  - `cd mobile && npm run typecheck`
  - `cd mobile && npm run lint`
- For frontend changes, prefer:
  - `cd frontend && npm run lint`
  - `cd frontend && npx tsc -p tsconfig.json --noEmit`
- If a check cannot be run, document why and call out the remaining risk.

## Git Hygiene

- Do not revert or overwrite unrelated user changes.
- Keep diffs focused on the requested task.
- Avoid destructive commands unless explicitly requested.
- Before finishing, review the diff for accidental churn, generated noise, or unrelated edits.
