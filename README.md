# Done Loop

Done Loop is a local-first productivity app for habits, tasks, and lightweight daily planning. The current product focus is the Expo React Native app in `mobile/`.

## Features

- Habit tracking with daily completion, reminders, filters, and monthly history.
- Task management with priorities, due dates, completion, reopening, editing, and deletion.
- Calendar view that combines habit activity and dated tasks.
- Local notifications for habit and task reminders.
- Local-first data storage powered by SQLite.
- App settings for notifications, language, date format, theme, and visual personalization.
- Theme modes: system, light, and dark.
- App color personalization: purple, blue, green, red, yellow, and pink.
- English and Spanish localization.
- Fraunces typography applied across the app.

## Project Structure

- `mobile/` - Expo React Native app for Android, iOS, and Expo-supported development workflows.
- `frontend/` - legacy Next.js web version.
- `backend/` - placeholder/backend workspace.

## Mobile Tech Stack

- Expo 54
- React 19
- React Native 0.81
- Expo Router
- TypeScript
- Expo SQLite
- Expo Notifications
- Expo Font

## Getting Started

Install and run the mobile app:

```bash
cd mobile
npm install
npm run start
```

You can also run the Android helper script:

```bash
cd mobile
npm run dev
```

## Mobile Commands

Run these from `mobile/`:

```bash
npm run start
npm run android
npm run typecheck
npm run lint
```

## Data Storage

The mobile app stores user data locally in SQLite. The database includes habits, habit completions, tasks, and user settings. Migrations live in `mobile/src/storage/migrations`.

User settings currently include:

- Notifications enabled
- Theme preference
- Accent color
- Language
- Date format
- Plan/status metadata
- Privacy and terms URLs when available

## Design Notes

Done Loop uses a calm, card-based mobile UI with light and dark themes. The accent system updates primary actions, selected states, borders, and habit history colors across the app. Fraunces is bundled locally and loaded through Expo Font.

## Legacy Web App

The `frontend/` directory contains the earlier Next.js implementation. It can still be run separately:

```bash
cd frontend
npm install
npm run dev
```

The root README now documents the current mobile app first because that is the active app experience.
