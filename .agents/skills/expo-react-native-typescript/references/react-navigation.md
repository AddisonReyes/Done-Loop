# React Navigation

Use this when the project depends on `@react-navigation/*` and defines explicit navigators.

## Rules

- Update typed param lists whenever routes change.
- Keep route names centralized if the project already centralizes them.
- Keep params serializable; pass ids or small primitives instead of large objects.
- Preserve navigator nesting, screen options, linking config, and auth guards.
- Use the existing navigator style: stack, native stack, tabs, drawer, or custom.

## Checks

- Verify type-safe `navigate`, `push`, `replace`, and `goBack` usage.
- Check deep links if linking config exists.
- Confirm header, gesture, modal, and tab behavior on iOS and Android when changed.
