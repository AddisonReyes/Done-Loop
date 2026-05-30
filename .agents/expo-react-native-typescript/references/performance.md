# Performance

Use this when touching lists, images, animations, data-heavy screens, maps, charts, or global state.

## Rules

- Use `FlatList` or `SectionList` for long or unbounded lists.
- Provide stable keys; avoid index keys when item order can change.
- Avoid heavy work in render; memoize only when it solves a real render or calculation problem.
- Keep context providers narrow enough that unrelated screens do not rerender.
- Avoid large image downloads or decoding on the JS thread; use the repo’s existing optimized image approach when present.
- Prefer native-driven or Reanimated animations when complex animations need smoothness.

## Checks

- Look for accidental rerenders from inline objects, broad context updates, or unstable callbacks.
- Check list empty/loading/footer states.
- Check low-end Android implications when adding expensive rendering.
