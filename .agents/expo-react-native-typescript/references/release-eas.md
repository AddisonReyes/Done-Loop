# EAS And Release Config

Use this when changing builds, app config, native permissions, app identity, environment variables, updates, or release behavior.

## Rules

- Inspect `eas.json`, Expo config, and package scripts before changing release behavior.
- Do not change `slug`, `scheme`, `owner`, `bundleIdentifier`, `package`, app name, or update channel unless explicitly required.
- Treat native config changes as requiring a rebuild.
- Keep secrets out of repo files; distinguish public `EXPO_PUBLIC_*` variables from secrets stored in EAS or CI.
- Preserve existing profiles such as development, preview, staging, and production.

## Checks

- Confirm config plugins match installed native dependencies.
- Confirm platform-specific permission copy is present when required.
- Run the lightest relevant build/config check available in the repo.
