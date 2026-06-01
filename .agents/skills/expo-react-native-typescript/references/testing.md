# Testing And Validation

Use project scripts from `package.json`. Prefer local commands over global CLIs.

## Validation Order

1. Typecheck.
2. Lint.
3. Unit/component tests.
4. Expo/Metro smoke check.
5. iOS/Android build check if native config changed.

## Scenarios

- Loading, empty, error, retry, and success states.
- Permission denied, unavailable API, and limited access states.
- Small screen layout, large text, safe areas, and keyboard overlap.
- Navigation forward/back and deep-link entry when route behavior changes.
- Offline or failed network behavior for data flows.

## Test Style

- Prefer tests around behavior and user-visible output over implementation details.
- Mock native modules only at the boundary.
- Avoid snapshot-only coverage for interactive flows.
