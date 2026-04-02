# GymPaddy Developer Manual

## App Overview
- Stack: Expo + React Native + Expo Router (file-based routing in `app/`).
- API config is centralized in `apiConfig.ts`.
- Main app metadata is in `app.json` (name, icon, bundle/package IDs, splash, updates).
- Build profiles are in `eas.json`.

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npx expo start
   ```
3. Run on device/simulator:
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## Project Structure (Important Files)
- `app/`: Screens/routes.
- `components/`: Shared UI and feature components.
- `apiConfig.ts`: API base URL and endpoint definitions.
- `app.json`: App identity, logo/icon, splash, native settings.
- `eas.json`: Build/submit profiles.
- `assets/images/`: Images including app logo assets.

## How To Update API

### 1) Change API Base URL
Edit `apiConfig.ts`:
- Update `API_DOMAIN` to your target backend URL.
- Keep `/api` suffix if your backend expects that prefix.

Example:
```ts
const API_DOMAIN = "https://your-domain.com/api";
```

### 2) Add/Update Endpoints
Edit `API_ENDPOINTS` in `apiConfig.ts`:
- Group new endpoints under the correct section (`AUTH`, `USER`, etc.).
- Use functions for path params (`(id: number) => ...`).

Example:
```ts
NEW_FEATURE: {
  List: API_DOMAIN + "/user/new-feature",
  Show: (id: number) => API_DOMAIN + `/user/new-feature/${id}`,
}
```

## How To Update Logo / App Icon
Current icon path is `./assets/images/logo.png` in `app.json`.

1. Replace `assets/images/logo.png` with the new image.
2. If needed, also update:
   - `expo.icon`
   - `expo.android.adaptiveIcon.foregroundImage`
   - `expo.android.adaptiveIcon.monochromeImage`
   - `expo.plugins` -> `expo-splash-screen.image`
3. Rebuild app for native changes to appear in installed builds.

Notes:
- Prefer a square PNG for icons.
- Keep filename/path stable if you want minimal config edits.

## How To Rename App / Package IDs
Edit `app.json`:
- Display name: `expo.name`
- Slug: `expo.slug`
- iOS bundle ID: `expo.ios.bundleIdentifier`
- Android package: `expo.android.package`
- Deep link scheme: `expo.scheme` (if needed)

After changing bundle/package IDs, create fresh native builds.

## Build and Release Basics (EAS)
Build profiles are in `eas.json`:
- `development`: dev client APK
- `preview`: internal distribution
- `production`: store-ready production build

Common commands:
```bash
eas build --platform android --profile development
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Safe Update Checklist
- Run app locally after changes.
- Verify API auth/login and one protected endpoint.
- Verify app icon + splash on a clean install.
- If `app.json` native fields changed, generate a new build.
- Keep secrets out of repo (use env/secure configs).

