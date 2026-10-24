# Notes implementation and Android verification

Notes supports plain text and checklists, optional titles, pinning, Unicode case-insensitive search, manual checklist ordering, and automatic local persistence. Checklist items remain independent of Tasks and Habits.

## Persistence

Migration 013 adds only `notes` and `note_checklist_items`, plus indexes for pinned/modification ordering and item retrieval. Item foreign keys cascade when a note is deleted. Existing user tables and earlier migrations are unchanged. Re-running the migration is safe, and the migration registry records completion transactionally.

Notes uses a serialized private connection to the same `done-loop.db` file, opened after the existing migration initialization. Both connections enable foreign keys and a five-second busy timeout. Note/item writes are atomic; item IDs and creation dates survive editing and reordering.

This connection isolation prevents unrelated repository queries from entering a Notes transaction, as described in the [Expo SDK 54 SQLite asynchronous transaction documentation](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/#executing-queries-within-an-async-transaction).

Text edits debounce for 500 ms; structural edits save promptly. The editor keeps the latest draft while older writes complete, and flushes before normal navigation. Errors retain the draft and offer retry. Empty new drafts are not stored. Clearing a saved note requires explicit deletion or continued editing.

Entering the Notes tab returns to its list, including after leaving an editor or deleting a cleared note. Restart restoration also opens the Notes list.

The custom headless tabs now register the startup route explicitly, and startup restoration uses the tab router's supported navigation action. Integration tests cover restoring Notes, Habits, and Settings. The existing settings column stores `/notes`; no settings schema change is needed.

## Automated verification

From `mobile/`, run:

```sh
npm run typecheck
npm run lint
npm run test
```

The SQLite integration tests use Node's built-in `node:sqlite`; use Node 22.13 or newer (Node 24 also works). No SQLite test dependency is installed. Tests exercise real SQL alongside the project's Jest and React Native Testing Library suites.

Results at the original Expo SDK 54 implementation baseline:

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run test` | Passed: 51 suites, 280 tests. |
| `npm.cmd run lint -- -- --cache-location <temporary writable path>` | Passed using the existing Expo lint script. The default `.expo` cache location returned a sandbox permission error; only the cache location was overridden. |
| `node ./node_modules/eslint/bin/eslint.js src --no-cache` | Passed. |
| `node ./node_modules/expo/bin/cli export --platform android --output-dir <temporary writable path>` | Passed; Android JavaScript/Hermes bundle exported. This does not replace device testing. |
| `git diff --check` | Passed. |
| Additional whole-directory ESLint check | Found the existing `scripts/dev-android.js:47` `__dirname` rule error, outside Expo's `src` lint scope. That script was left unchanged. |
| Android device/emulator checks | Not run; Android tooling/device access was unavailable in this environment. |

The four existing June-dependent habit tests now set their fake clock to June 3, 2026, at local noon. Habit behavior is unchanged. Real SQLite tests cover migration 001–012 data upgraded through 013, repeated creation, existing data preservation, constraints, cascading deletion, rollback, CRUD, pinning, checklist ordering/completion, and English/Spanish search. Fake timers and deferred writes cover autosave races and failures. React Native Testing Library tests include the real Expo tabs and Notes Stack, deep links, restoration, departure during saves, retry, and clearing/deletion.

### SDK 58 navigation follow-up

After the dependency upgrade to Expo SDK 58 / Expo Router 58.0.26, application imports from `@react-navigation/native` no longer resolved. The layout theme and editor navigation APIs now come from `expo-router`, following the [Expo Router import migration guide](https://docs.expo.dev/router/migrate/sdk-55-to-56/). Notes uses the current `resetOnFocus` tab prop and the removal guard's `repeat()` / `disablePrevention()` APIs. The corresponding editor test mock follows the new exports. No dependency changes were made for this fix.

Validation on October 24, 2026:

- Android export passed: 1,794 modules bundled and a Hermes bundle produced.
- Typecheck ran but fails on existing SDK upgrade compatibility issues: React Native component/ref types, removed `StyleSheet.absoluteFillObject`, and missing Jest globals in the TypeScript 7 configuration.
- Expo lint ran but its TypeScript parser fails to load (`Cannot read properties of undefined (reading 'Cjs')`).
- Targeted editor/tab tests could not start because `jest-expo` now requires the missing `@react-native/jest-preset` peer dependency.
- The SDK 54 baseline results above are historical; they do not describe the upgraded toolchain's current check results.

### SDK 58 Expo Go startup follow-up

The Notes Stack now declares `unstable_settings.anchor` instead of the deprecated `initialRouteName`, following the [SDK 58 route settings migration](https://docs.expo.dev/router/migrate/sdk-57-to-58/#move-initialroutename-to-unstable_settings).

Notification startup uses Expo's [`isRunningInExpoGo()`](https://docs.expo.dev/versions/v58.0.0/sdk/expo/#isrunninginexpogo) instead of deprecated app ownership detection. Android Expo Go skips loading the notifications entry point, which imports the missing `ExpoTopicSubscriptionModule`. The existing policy of testing reminders in development/release builds is preserved. Failed or partial module loads and native initialization failures now return unavailable instead of rejecting startup promises. No packages or native configuration changed.

Validation: all 31 notification service tests passed with a temporary, isolated Node Jest configuration using the installed Babel transformer and mocked native APIs. Coverage includes Expo Go avoiding module imports, concurrent initialization sharing one load, synchronous/asynchronous load failures, incomplete exports, and native API failures. Android export passed again with 1,794 modules. The normal `jest-expo` runner remains blocked by the missing `@react-native/jest-preset`; lint still fails while loading its TypeScript parser; typecheck still reports the existing upgrade errors, with no diagnostics in the changed notification service or Notes Stack layout. Actual Expo Go/device startup remains a manual check; fully reload after restarting Metro with `npx expo start --clear`.

### Tasks and Notes empty lists

The list scaffold accepts an optional `emptyMessage`, rendered as plain centered text in the space remaining below the header and above the bottom navigation. Tasks uses it in list/calendar modes; Notes uses it for empty lists and searches with no results. Both retain only their floating creation action. Loading/error feedback remains separate, and other uses of `EmptyState` are unchanged. Flexible sizing allows text to wrap and the content to scroll when space is limited.

Android export passed with 1,794 modules. Component tests were updated for the sole creation action, English/Spanish empty messages, task view modes, search, and loading/errors. Their execution remains blocked by the missing `@react-native/jest-preset`. Lint still fails loading its TypeScript parser; typecheck reports the existing SDK upgrade errors, with no diagnostics in the three changed application components. Visual checks on a device for both themes, small screens, and enlarged system text remain pending.

## Changed files

Paths below are relative to the repository root. Existing package and lockfile changes were preserved; this implementation adds no dependencies.

Added:

- `mobile/NOTES.md`
- `mobile/src/app/notes/_layout.tsx`, `index.tsx`, `new.tsx`, `[id].tsx`
- `mobile/src/features/notes/types/note.ts`, `index.ts`
- `mobile/src/features/notes/repositories/notes-repository.ts`, `index.ts`, `notes-repository.test.ts`
- `mobile/src/features/notes/services/note-draft.ts`, `note-draft.test.ts`, `note-search.ts`, `note-search.test.ts`, `note-autosave.ts`, `note-autosave.test.ts`, `navigation-guard.tsx`, `navigation-guard.test.tsx`
- `mobile/src/features/notes/hooks/use-note-editor.ts`, `use-note-editor.test.tsx`, `use-notes.ts`, `use-notes.test.tsx`
- `mobile/src/features/notes/components/invalid-note-route.tsx`, `note-action-button.tsx`, `note-checklist-item.tsx`, `note-editor-screen.tsx`, `note-editor-screen.test.tsx`, `note-list-item.tsx`, `notes-screen.tsx`, `notes-screen.test.tsx`
- `mobile/src/storage/migrations/migration-013-add-notes.ts`, `notes-migration.integration.test.ts`
- `mobile/src/test/sqlite-test-database.ts`
- `mobile/src/__tests__/app/index.test.tsx`, `notes-routes.test.tsx`, `notes-navigation.integration.test.tsx`
- `mobile/src/components/app-tabs.test.tsx`
- `mobile/src/features/settings/repositories/settings-repository.test.ts`
- `mobile/src/i18n/notes-translations.test.ts`

Modified:

- `DESIGN.md`, `mobile/README.md`
- `mobile/src/app/index.tsx`, `mobile/src/app/_layout.tsx`, `mobile/src/components/app-tabs.tsx`
- `mobile/src/features/settings/types/user-settings.ts`, `repositories/settings-repository.ts`, `hooks/use-date-format-preference.ts`
- `mobile/src/i18n/translations.ts`
- `mobile/src/shared/components/floating-create-button.tsx`, `screen-scaffold.tsx`, `virtualized-screen-scaffold.tsx`
- `mobile/src/shared/events/app-events.ts`, `app-events.test.ts`
- `mobile/src/storage/database/client.ts`, `client.test.ts`
- `mobile/src/storage/migrations/index.ts`, `migrations.test.ts`
- `mobile/src/features/habits/hooks/use-habits.test.tsx`
- `mobile/src/features/notifications/services/notification-service.ts`, `notification-service.test.ts`
- `mobile/src/app/todos/index.tsx`, `mobile/src/__tests__/app/todos-index.test.tsx`, `mobile/src/shared/components/virtualized-screen-scaffold.test.tsx`

## Manual Android checklist

Use an emulator or device, including a small portrait screen around 320 logical pixels wide. These steps describe manual checks; they are not evidence that device testing was performed.

- [ ] Verify tab order is Habits, Tasks, Notes, Calendar, Settings. Check all five touch targets, TalkBack labels and selected states, display cutouts, and bottom safe areas.
- [ ] With no tasks or notes, verify the message is centered below the filters/search, has no card or extra creation button, and the floating button opens creation. Repeat with an empty Notes search, both task modes, both languages/themes, a small screen, and enlarged system text. Loading/errors must not also show the empty message.
- [ ] Create a text note without a title, then a title-only note. Paste text longer than 600 characters and several paragraphs. Confirm multiline text, spaces, and line breaks survive reopening.
- [ ] Open and leave untouched or whitespace-only drafts. Confirm no empty note appears. Clear a saved note and verify Keep editing retains the draft and Delete removes it only after confirmation.
- [ ] Type with the keyboard visible near the bottom of a long note. Verify the caret stays visible, scrolling works, and back/pin/delete controls remain usable.
- [ ] Create a checklist. Use Enter and Add item to insert and focus rows. Edit long text, complete/reopen items, move items up/down, and confirm populated-item deletion. Check ordering, disabled boundary actions, and progress counts after reopening.
- [ ] Search by title, body, and completed item text. Try `ÁRBOL`/`árbol`, `NIÑO`/`niño`, punctuation, and no-result searches. Pin/unpin notes and verify grouping and modification ordering.
- [ ] Type rapidly, then immediately press editor back, Android back, and another tab; return and verify the final text. Repeat while toggling completion or moving items. Delete during a pending save and verify the note does not reappear.
- [ ] Background and resume during editing. Wait for Saved feedback, force-stop/relaunch, and confirm content and the Notes root restore. Repeat offline.
- [ ] Check English and Spanish, both themes, all six accent colors, every app background, date formats, animations on/off, and larger system text.
- [ ] Upgrade over an installed pre-Notes build using the same application identity and compatible signing, without uninstalling or clearing app data. Before upgrading, seed habits/history, tasks, reminders, and nondefault preferences. After upgrading, verify all data/preferences remain, reminders still function, and new notes survive restart.
- [ ] Exercise a persistence failure in a controlled development build or through mocked repository failure. Confirm the latest draft remains visible, retry works, and navigation does not silently abandon changes.

## Limits

An abrupt process termination before a pending write finishes can lose unsaved changes. Background flushing is best effort; normal navigation waits for saving. Search loads local note content and checklist items in memory, following the app's existing all-record list pattern. Notes has no type conversion, folders, rich text, attachments, reminders, or synchronization.
