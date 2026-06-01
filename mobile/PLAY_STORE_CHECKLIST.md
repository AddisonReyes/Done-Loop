# Done Loop Play Store Checklist

## App Identity

- App name: Done Loop
- Android package: `com.addisonreyes.doneloop`
- Version: `1.0.0`
- Version code: `1`
- Current release target: Android first

## Assets

- [ ] Final app icon 512x512
- [ ] Adaptive Android icon
- [ ] Splash screen
- [ ] Notification icon
- [ ] Phone screenshots
- [ ] Feature graphic if needed

## Store Listing

- [ ] Short description
- [ ] Long description
- [ ] Privacy policy URL
- [ ] Terms URL if purchases are enabled
- [ ] Content rating questionnaire
- [ ] Data Safety form

## Permissions

- Notifications: used for local habit and task reminders.
- SQLite/local storage: stores user habits, task history, settings, and completion history locally.
- No backend, login, cloud sync, real ads, analytics, or real payments are implemented in this stage.

## EAS Build

Recommended next setup:

```sh
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Before production:

- [ ] Create `eas.json` profiles for development, preview, and production.
- [ ] Generate an Android App Bundle.
- [ ] Test internal release on Google Play Console.
- [ ] Use test ad IDs only during development if ads are added later.
- [ ] Configure real Play Billing products only when purchases are implemented.
