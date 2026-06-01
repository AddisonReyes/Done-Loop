# Expo Router

Use this when the project has an `app/` directory with Expo Router conventions, `expo-router` in dependencies, or routes such as `_layout.tsx`.

## Rules

- Follow file-based routing; create or move screens by route file, not by manual route registries.
- Keep params serializable and validate params from URL/deep links before use.
- Use typed route helpers when the repo has typed routes enabled.
- Preserve `_layout.tsx`, groups, tabs, modals, and protected route structure.
- Do not introduce React Navigation manual navigators inside Expo Router unless the repo already uses that pattern.

## Checks

- Confirm route names and dynamic segments match the path.
- Test navigation forward, back, refresh/reload, and deep-link entry when relevant.
- Check loading and error states for routes that fetch data from params.
