---
name: expo-react-native-typescript
description: Use when building, debugging, refactoring, testing, or reviewing Expo / React Native apps written in TypeScript, including routing, native APIs, UI, state, performance, accessibility, EAS builds, and mobile-specific behavior.
---

# Expo React Native TypeScript

Use this skill for Expo or React Native projects that use TypeScript. The goal is senior-level mobile engineering: inspect first, follow the repo, preserve platform behavior, and validate with the project’s own commands.

## First Pass

Before editing code:

- Inspect `package.json`, Expo config (`app.json`, `app.config.*`), `tsconfig.json`, routing entrypoints, and available scripts.
- Identify Expo SDK, React Native version, routing system, styling system, state/data stack, test setup, and target platforms.
- Prefer existing project patterns over new libraries or new architecture.
- Run `scripts/inspect-expo-project.sh` from the project root when useful.
- If behavior depends on current Expo APIs, check official Expo docs before relying on memory.

## Engineering Rules

- Keep changes small, typed, platform-aware, and easy to verify.
- Avoid `any`, unsafe casts, and weakening TypeScript settings.
- Preserve iOS, Android, and web behavior when the project supports them.
- Do not change app identity, package/bundle identifiers, schemes, permissions, config plugins, EAS profiles, or native folders unless the task requires it.
- Treat mobile UX as part of correctness: safe areas, keyboard behavior, touch targets, loading/error/empty states, permissions, offline/failure paths, and small screens.
- Do not introduce dependencies unless they clearly reduce complexity or match an existing stack.

## React Native UI

- Use React Native primitives, not DOM elements or browser-only APIs.
- Respect safe areas with the project’s existing safe-area approach.
- Handle keyboard overlap in forms and bottom actions.
- Prefer stable responsive layout constraints over magic dimensions.
- Use `FlatList` or `SectionList` for long or unbounded lists.
- Add accessibility roles/labels/states when elements are interactive or non-obvious.
- Keep text scaling and contrast in mind; do not assume a single device size.

## TypeScript

- Type exported functions, navigation params, API DTOs, storage payloads, and component props precisely.
- Use discriminated unions for async or multi-state UI when it clarifies behavior.
- Validate untrusted API, route, deep-link, and storage data before using it.
- Do not hide errors with `as unknown as`, broad `Record<string, unknown>` plumbing, or non-null assertions unless the invariant is local and obvious.

## Navigation

- Detect whether the app uses Expo Router, React Navigation, or another router before changing routes.
- For Expo Router, follow file-based routing conventions and keep route params serializable.
- For React Navigation, update typed param lists and route names together.
- Preserve deep-linking behavior when linking config exists.
- Do not mix routing systems.

## Expo Native APIs

- Check permission requirements, config plugin needs, and Expo Go compatibility before adding native API usage.
- Handle `granted`, `denied`, `limited`, and unavailable states where relevant.
- Ask for permissions at the point of need, not during app startup, unless the product already does so intentionally.
- Keep secrets out of client config; only `EXPO_PUBLIC_*` values are safe for client exposure.

## State And Data

- Use the repo’s existing state/data library: React Query for server state, existing store libraries for app/client state, and local component state for local UI.
- Do not add global state for isolated screen concerns.
- Separate server state, persisted client state, and transient UI state.
- Model loading, error, empty, retry, refresh, and optimistic paths explicitly when the feature needs them.

## Validation

Use commands from `package.json`; do not invent scripts. Prefer this order:

1. Typecheck.
2. Lint.
3. Unit/component tests.
4. Expo or Metro smoke check when feasible.
5. Platform-specific build/check if native config changed.

If validation cannot run, explain why and name the residual risk.

## References

Read only the reference needed for the task:

- Expo Router: `references/expo-router.md`
- React Navigation: `references/react-navigation.md`
- Native APIs and permissions: `references/native-apis.md`
- Testing and validation: `references/testing.md`
- Performance: `references/performance.md`
- EAS and release config: `references/release-eas.md`
