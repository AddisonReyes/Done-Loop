# Background rendering compatibility

The installed React Native 0.88 exports `StyleSheet.absoluteFill` and no longer exports `absoluteFillObject`. Spreading the removed property produces an empty style object. A background using that style loses its absolute positioning and parent-sized bounds: the gradient can have zero height, and vertical grid lines anchored with `top`/`bottom` have no height to fill.

The background, modal backdrop and dismiss target, dropdown backdrop, and splash overlay now use the supported [`StyleSheet.absoluteFill`](https://reactnative.dev/docs/stylesheet#absolutefill). The screen scaffolds already place the background before their scroll/list content and clip decoration to the screen. Decorative layers retain `pointerEvents="none"`. Colors, opacity, grid spacing/thickness, theme/accent preferences, dependencies, and storage are unchanged.

Changed production components:

- `src/shared/components/app-background.tsx`
- `src/shared/components/app-modal.tsx`
- `src/shared/components/dropdown-select.tsx`
- `src/components/animated-icon.tsx`

## Automated verification

`src/shared/components/app-background.test.tsx` covers parent-sized bounds and non-interactive decoration for all four backgrounds in both themes; gradient updates for all six accents in both themes; and complete horizontal/vertical grid coverage at three window sizes.

Results on October 24, 2026:

| Check | Result |
| --- | --- |
| Background component tests, isolated configuration | **26 passed.** Used the installed React Native Testing Library, React Native's real StyleSheet/color utilities, and temporary native-boundary mocks. This checks the rendered component tree and styles, not Android GPU output. |
| Standard project Jest command | Cannot initialize: installed `jest-expo` requires the missing `@react-native/jest-preset` peer dependency. |
| Typecheck | Existing SDK upgrade errors remain in tab/checklist refs and test globals. No diagnostics in the changed files, including the new test. All five removed-property errors are resolved. |
| Expo lint | Cannot initialize its TypeScript parser: `Cannot read properties of undefined (reading 'Cjs')`. |
| Android export | **Passed**, 1,794 modules and a Hermes bundle. Output went to a temporary directory. |
| `git diff --check` | Passed. |
| TCL/device rendering | Not executed; no connected Android tooling was available. Use the checklist below. |

The standard targeted test command, once the existing test environment is repaired, is:

```sh
npm run test -- --runTestsByPath src/shared/components/app-background.test.tsx
```

## Manual Android checklist

Start from the updated code and fully reload the app. If using Metro, run `npx expo start --clear` from `mobile/` before reopening it.

- [ ] On the TCL, verify Gradient, Grid, Solar, and None in Habits, Tasks, Notes, Calendar, and Settings, in light and dark themes.
- [ ] Confirm the gradient fills the visible screen behind content. Switch through all six accents and verify an immediate color update; reopen the app to check saved selections.
- [ ] Confirm the grid has both vertical and horizontal lines across the screen, including the bottom area above navigation. Keep the current spacing and line thickness.
- [ ] Verify backgrounds behind empty Tasks/Notes, a Notes search with no results, long scrolling lists, and the text/checklist editors with the keyboard open. Content and floating buttons must remain usable.
- [ ] Open and close task/note creation modals and Settings dropdowns. Their backdrop must cover the screen, outside taps must dismiss where supported, and controls inside must remain usable.
- [ ] Restart with animations enabled, then disabled. The splash overlay must not remain over the app after startup.
- [ ] Repeat the rendering checks in the TCL's usual display mode and with NXTPAPER modes enabled/disabled where available. Also check increased system text/display scaling.
- [ ] If available, compare with the previous OnePlus or another Android device. Record any remaining visibility issue before considering contrast changes.
