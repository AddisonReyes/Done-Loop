# Done Loop Design

Done Loop is a local-first productivity app for closing everyday loops: habits, tasks, and calendar planning. Its design should feel calm, private, clear, and lightweight. The interface helps people record progress without turning productivity into pressure, aggressive gamification, or visual noise.

This document describes the current visual language of the mobile app in `mobile/` and should guide new screens, components, and UI changes.

## Principles

- **Calm before urgency.** Use scannable information, gentle states, and restrained microinteractions. Avoid patterns that create anxiety, competition, or dependency.
- **Local and private.** The UI must not imply accounts, cloud services, analytics, ads, memberships, purchases, or remote sync.
- **Visible progress.** Completed, pending, empty, loading, and error states should be obvious without feeling loud.
- **Sober personalization.** Users can choose theme, accent color, language, date format, animations, and background. New surfaces must respect those preferences.
- **Practical accessibility.** Every interactive action needs a role, label, or state when it is not obvious. Controls should keep comfortable touch targets and readable text.

## Visual Personality

The app combines a soft editorial base with straightforward productivity controls. Fraunces gives the UI warmth; cards, borders, and subtle backgrounds keep it ordered. The result should feel like a polished digital notebook, not an enterprise dashboard or a landing page.

Avoid:

- Excess decoration, generic illustrations, or dominant backgrounds.
- Huge hierarchy inside operational screens.
- Saturated status colors across large areas.
- Motivational, competitive, or punitive copy.

Prefer:

- Short headings.
- Compact cards with useful information.
- Icons for frequent actions.
- Selected states with soft accent fill, stronger borders, and clear text.

## Theme And Color

Tokens live in `mobile/src/constants/theme.ts`.

### Surfaces

- `background`: base screen background.
- `backgroundElement`: primary surface for cards, modals, and the bottom bar.
- `backgroundSelected`: surface for selectable controls, secondary buttons, and segments.
- `surfaceSoft` and `surfaceStrong`: supporting variants for rows, summaries, and groups.
- `border`: default border.
- `borderStrong`: selected border or border directly related to the accent.

In light mode, the app uses a `#F7F7FB` base with white surfaces. In dark mode, it uses a near-black `#0B0B0F` base with `#17171D` and `#22222A` surfaces.

### Accents

The accent is user-configurable: purple, blue, green, red, yellow, and pink. Screens should not depend on a fixed color except white for icons/text on filled accent backgrounds.

Use:

- `accent` for primary actions and active elements.
- `accentSoft` for completed states, active rows, and selected backgrounds.
- `accentStrong` for active text, icons, and borders.

Do not use the accent everywhere. It should signal action, selection, or progress.

### States

- `success`: positive non-interactive information.
- `warning`: recoverable messages, loading errors, or non-destructive validation.
- `danger`: destructive actions or deletion states.
- `textSecondary`: metadata, descriptions, and labels.
- `textMuted`: lower-priority information or disabled controls.

## Typography

The primary typeface is Fraunces:

- `Fonts.sans`: `Fraunces-Medium`.
- `Fonts.serif`: `Fraunces-SemiBold`.
- `Fonts.bold`: `Fraunces-Bold`.

Current `ThemedText` scale:

- `title`: 48/52, reserved for large reusable titles.
- `subtitle`: 32/44, visible summary numbers and figures.
- `default`: 16/24, normal reading text.
- `small` and `smallBold`: 14/20, compact UI, labels, rows, and actions.
- `code`: 12, calendar numbers.

On screens using `ScreenScaffold`, the title is adjusted to 30/36. Keep this scale for operational screens; do not introduce hero text inside the app.

## Spacing And Layout

Use the `Spacing` tokens:

- `half`: 2
- `one`: 4
- `two`: 8
- `three`: 16
- `four`: 24
- `five`: 32
- `six`: 64

Rules:

- Main screens use `ScreenScaffold`: safe areas, scroll, max width of 720, and minimum horizontal padding of 16.
- Primary stacks use `gap: Spacing.three`.
- Internal lists and compact groups use `gap: Spacing.two`.
- Dense details may use `gap: Spacing.one`.
- Avoid layouts that depend on fixed widths except for touch controls.
- In rows with text and actions, allow wrapping and define `minWidth: 0` where text needs to shrink.

## Radius, Borders, And Elevation

The app uses broad but functional rounded corners:

- Section cards and empty states: 20.
- List items and selected bars: 18.
- Segmented controls: 16 with a 13-radius indicator.
- Icon buttons: 14.
- Calendar cells: 12.
- Floating button: 54x54 with radius 27.
- Bottom sheets: top radii of 28.

Borders are central to the system. Almost every interactive surface should use `borderWidth: 1`. Use shadows only for floating layers: bottom bar, floating button, and modal.

## Backgrounds

`AppBackground` supports:

- `none`: flat background color.
- `gradient`: very subtle diagonal gradient from the accent toward the background.
- `grid`: 32px grid with discreet circular glows.
- `solar`: rings from the top-right corner with accent glow.

New screens should use `ScreenScaffold` to inherit the chosen background. Do not add custom decorative backgrounds per screen unless there is a clear need and it works in both light and dark themes.

## Base Components

### ScreenScaffold

Use for main screens. It includes safe area handling, background, title, optional description, and max width. Content should be arranged as scannable vertical sections.

### SectionCard

Use to group related controls or information. Do not nest cards inside cards. A section title uses `smallBold` with `accentStrong`.

### List Items

Habits and tasks use cards with:

- `backgroundElement` in the normal state.
- `accentSoft` background and `borderStrong` when completed.
- Actions as 44x44 square icon buttons.
- Metadata in label/value rows, with secondary labels and bold values.

Keep this pattern for new list items.

### SegmentedControl

Use for small sets of mutually exclusive options. With 4 or more options, the control can wrap into multiple lines. The selected state uses the main surface, `accentStrong` text, and an optional 180ms animation.

### FloatingCreateButton

Use to create the primary item on a list screen. It should stay above the bottom bar, use a `plus` icon, accent background, and an accessible create label.

### AppModal

Creation and editing forms are presented as bottom sheets:

- Black backdrop at 52%.
- Sheet with `backgroundElement`, border, shadow, and max width 640.
- Compact header with title and close action.
- `KeyboardAvoidingView` to protect forms.

### EmptyState

Use when a list has no content or a filter returns no results. The message should be short. Include a primary action only when the next step is obvious.

## Navigation

The main navigation is a bottom bar with four tabs:

- Habits: `checkbox-marked-circle-outline`
- Tasks: `format-list-checks`
- Calendar: `calendar`
- Settings: `cog-outline`

The bar uses icons without visible text, minimum height 52, bottom safe area, and `backgroundElement`. The active tab uses `accentStrong`; inactive tabs use `textSecondary`.

## Motion

Animations are a user preference. Every new animation must respect `animationsEnabled`.

Current patterns:

- List entry through `AnimatedListItem`, limited to the first 24 items.
- Completion state changes with a slight scale and spring.
- Buttons scale to 0.96 while pressed.
- Modals fade in over 160ms.
- Segments animate over 180ms with cubic easing.

Keep motion short, reversible, and functional. If animations are disabled, the state should update immediately without degrading the experience.

## Forms And Controls

- Use native controls when appropriate, such as `Switch`.
- Use `DropdownSelect` for lists where text may be long or there are several options.
- Use swatches for accent color selection.
- Touch actions should be at least 40x40; prefer 44x44 for icons.
- Fields and controls should have visible labels or `accessibilityLabel`.
- Destructive actions must be confirmed when they delete user data.

## Calendar And Progress

The monthly history is a key visualization:

- 7-column grid with square cells.
- `historyEmpty`, `historyPartial`, and `historyComplete` represent activity.
- Selected day: `accentStrong` border.
- Monthly marker: 10x10 dot in the top-right corner.
- Visible legend with dots and labels.

History colors come from the theme and accent. Do not hard-code calendar colors outside the tokens.

## Content

The app supports English and Spanish. All visible UI text must go through i18n.

The voice should be:

- Clear.
- Brief.
- Respectful.
- Neutral toward the user's progress.

Avoid phrases that blame, shame, or exaggerate achievements. States should describe what is happening: completed, pending, no tasks, no habits for the day, loading.

## Accessibility

Requirements for UI changes:

- Interactive `Pressable` components should have `accessibilityRole` when it is not implicit.
- Icon-only buttons need `accessibilityLabel`.
- Selected, checked, or disabled controls need `accessibilityState`.
- Maintain enough contrast in light and dark themes.
- Support long text, wrapping, and small screens.
- Do not rely on color alone to communicate selection when there is room for a border, icon, or text.

## New UI Checklist

Before finishing a screen or component:

- Use `theme.ts` tokens instead of loose colors.
- Respect light theme, dark theme, and accent color.
- Respect `animationsEnabled`.
- Keep touch targets at 40-44px or larger.
- Include loading, empty, and error states where relevant.
- Do not introduce accounts, cloud services, analytics, payments, or ads.
- Use i18n for visible text.
- Check text wrapping and safe areas.
- Keep diffs small and follow existing patterns.

## Code References

- Theme: `mobile/src/constants/theme.ts`
- Text: `mobile/src/components/themed-text.tsx`
- Scaffolding: `mobile/src/shared/components/screen-scaffold.tsx`
- Backgrounds: `mobile/src/shared/components/app-background.tsx`
- Cards: `mobile/src/shared/components/section-card.tsx`
- Segments: `mobile/src/shared/components/segmented-control.tsx`
- Modals: `mobile/src/shared/components/app-modal.tsx`
- Create button: `mobile/src/shared/components/floating-create-button.tsx`
- Tabs: `mobile/src/components/app-tabs.tsx`
- Habit items: `mobile/src/features/habits/components/habit-list-item.tsx`
- Task items: `mobile/src/features/todos/components/todo-list-item.tsx`
- Monthly history: `mobile/src/features/habits/components/habit-month-history.tsx`
