# Expo Native APIs And Permissions

Use this for camera, location, notifications, media library, image picker, secure storage, file system, linking, device APIs, updates, or any native dependency.

## Rules

- Check official Expo docs for current API shape when adding or changing native API usage.
- Verify whether a config plugin or app config permission is required.
- Preserve Expo Go compatibility unless the repo already uses development builds.
- Model permission states explicitly: unknown/not requested, granted, denied, limited, unavailable.
- Request permissions at the point of need and explain why in UI if denial blocks the flow.
- Keep secrets out of Expo client config and source files.

## Platform Notes

- iOS and Android permission names, limited access modes, background behavior, and notification setup can differ.
- Web support may be absent or degraded; gate platform-specific APIs when the project supports web.
- Native config changes usually require a rebuild or prebuild/development build.
