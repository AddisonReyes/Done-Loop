# Done Loop Mobile

Done Loop is a free, open source Expo React Native productivity app for building habits, managing tasks, and reviewing daily progress in one local-first experience.

The app has no ads, memberships, subscriptions, in-app purchases, analytics, account system, backend, or cloud sync. User data stays local on the device.

## What The App Does

- Tracks habits with daily completion, recurring schedules, reminders, and monthly history.
- Manages tasks with priorities, due dates, completion, reopening, editing, and deletion.
- Keeps text notes and independent checklists with autosave, search, and pinning.
- Shows a calendar view for habit activity and dated tasks.
- Stores app data locally with SQLite.
- Supports English and Spanish.
- Includes settings for notifications, theme, app color, language, and date format.
- Includes links to the Privacy Policy, Terms of Service, and source code.
- Supports system, light, and dark theme modes.
- Lets users personalize the app accent color with purple, blue, green, red, yellow, or pink.
- Uses Fraunces as the app-wide typography.

## Tech Stack

- Expo 54
- React 19
- React Native 0.81
- Expo Router
- TypeScript
- Expo SQLite
- Expo Notifications
- Expo Font
- React Native Safe Area Context

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

Start on Android:

```bash
npm run android
```

Use the project Android helper script:

```bash
npm run dev
```

## Scripts

```bash
npm run start
npm run android
npm run dev
npm run typecheck
npm run lint
npm run test
```

## App Structure

- `src/app/` - Expo Router screens and layout.
- `src/features/habits/` - habit domain types, hooks, repositories, and components.
- `src/features/todos/` - task domain types, hooks, repositories, and components.
- `src/features/notes/` - note and checklist persistence, autosave, hooks, and components.
- `src/features/settings/` - persisted user settings.
- `src/features/notifications/` - notification scheduling and permission handling.
- `src/storage/` - SQLite client and migrations.
- `src/shared/` - reusable UI, constants, hooks, and utilities.
- `src/components/` - app-level shared components.
- `src/constants/theme.ts` - base theme tokens, accent color palettes, spacing, and fonts.
- `src/i18n/` - translations and localization context.

## Data Storage

Done Loop is local-first. Data is stored in SQLite through repositories and migrations.

The database currently stores:

- Habits
- Habit completions
- Tasks
- Notes and note checklist items
- User settings

When changing persisted data, add a migration in `src/storage/migrations` and keep existing user data compatible.

User settings include notification, theme, accent color, language, date format, privacy URL, and terms URL values. The app should remain free-only unless product direction explicitly changes.

## Theming And Personalization

The app resolves theme mode from the user preference:

- System
- Light
- Dark

Accent colors are stored in user settings and applied globally through `useTheme()`:

- Purple
- Blue
- Green
- Red
- Yellow
- Pink

Typography is bundled locally in `assets/fonts` and loaded with Expo Font before rendering the app shell.

## Quality Checks

Run these before finishing app changes:

```bash
npm run typecheck
npm run lint
```

## Notes For Contributors

- Follow the root `AGENTS.md` and this directory's `AGENTS.md`.
- Keep changes typed, focused, and consistent with the existing feature structure.
- Preserve the free, local-first, no-ads/no-purchases product model.
- Prefer existing shared components before creating new UI patterns.
- Treat local data carefully; migrations should be safe for existing installs.
- Do not change app identity, bundle/package IDs, native config, or permissions unless the task requires it.

## Legal And Source

- Privacy Policy: https://done-loop.com/privacy
- Terms of Service: https://done-loop.pages.dev/terms
- Source code: https://github.com/AddisonReyes/done-loop
- License: MIT, see the repository root `LICENSE` and `LICENSE.md`.
