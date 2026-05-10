# Build Foundry for Android (Play Store) & iOS (App Store)

Foundry is a Progressive Web App (PWA) wrapped with **Capacitor** for native builds.
The web bundle is identical for all platforms; only the native shell differs.

> ⚠️ Native builds **cannot** be produced inside this preview container.
> Run these steps on your own machine.

---

## Prerequisites

| Platform | Required |
|---|---|
| Both | Node.js ≥ 18, Yarn, the Foundry source code, a deployed Foundry **backend URL** (or use the preview URL) |
| Android (Play Store) | **Android Studio**, JDK 17, Google Play Console account ($25 one-time) |
| iOS (App Store) | **Mac with Xcode 15+**, Apple Developer account ($99/yr) |

---

## 1. Install Capacitor in the frontend

```bash
cd frontend
yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios \
         @capacitor/splash-screen @capacitor/status-bar
```

## 2. Point the wrapper at your backend

Set the backend URL the native app will call:

```bash
# Linux/macOS
export CAPACITOR_SERVER_URL="https://your-foundry-backend.example.com"
# Windows PowerShell
$env:CAPACITOR_SERVER_URL = "https://your-foundry-backend.example.com"
```

Or hard-code the URL in `frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://your-foundry-backend.example.com
```

## 3. Build the web bundle

```bash
yarn build           # produces frontend/build/
```

## 4. Initialise the Capacitor project

```bash
npx cap init Foundry app.foundry.command --web-dir build
```

(Skip this step if `capacitor.config.ts` already exists — it does in this repo.)

## 5. Add the native platforms

```bash
npx cap add android
npx cap add ios          # macOS only
npx cap sync             # copies frontend/build/ into each platform
```

---

## 6a. Android — open & ship

```bash
npx cap open android
```

Android Studio opens. To produce a Play Store bundle:

1. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**
2. Create or pick your **keystore** (keep it forever — without it you cannot publish updates).
3. Choose `release` build type → Finish.
4. Upload the `.aab` to **Google Play Console → Create app → Production track**.
5. Fill out the **Data Safety form** (we store: business profile, tasks, vault docs; we do not collect IDs).
6. Submit for review.

### App icons
- Drop a 1024×1024 PNG of the Foundry mark into `frontend/resources/icon.png`
- Generate per-density assets: `npx @capacitor/assets generate --android`

### Play Store policy notes
- Foundry passes a user prompt to OpenRouter/Ollama; declare **Generative AI** in Play Console.
- Privacy Policy URL: link to `/privacy` from your deployed site.
- Target API level 34+ (Capacitor default).

---

## 6b. iOS — open & ship (macOS only)

```bash
npx cap open ios
```

Xcode opens with `App.xcworkspace`.

1. Set the **Team** under *Signing & Capabilities* → your Apple Developer team.
2. Set the **Bundle Identifier** to `app.foundry.command`.
3. Set the **Version** and **Build** numbers.
4. **Product → Archive** → Distribute App → App Store Connect.
5. In **App Store Connect**, create the app entry, fill out App Privacy nutrition labels:
   - Data collected: *Business name, industry, country, user-created notes.*
   - Linked to identity: No (no email/phone collected).
   - Used for tracking: No.
6. Submit for review.

### App icons
- Drop a 1024×1024 PNG into `frontend/resources/icon.png`
- Generate: `npx @capacitor/assets generate --ios`

### iOS policy notes
- Foundry uses the Web Speech API (microphone) — Info.plist requires
  `NSMicrophoneUsageDescription`. Capacitor's plugin will write this if you
  add the `@capacitor/microphone` package; otherwise, set it manually in `ios/App/App/Info.plist`:
  ```xml
  <key>NSMicrophoneUsageDescription</key>
  <string>Foundry uses the microphone for hands-free voice input to AI agents.</string>
  ```

---

## 7. Re-sync after any web change

Every time you edit `frontend/src/...` and want to ship a new native build:

```bash
yarn build && npx cap sync
```

Then re-open the native IDE and rebuild/archive.

---

## Quick troubleshooting

| Symptom | Fix |
|---|---|
| White screen on launch | Check `CAPACITOR_SERVER_URL` is set, the URL has HTTPS, and CORS allows the WebView origin. |
| `Failed to connect to backend` in app | The native shell can't reach the backend. Check the URL is reachable from a phone (try Safari/Chrome on the device). |
| Microphone never prompts | Add the `NSMicrophoneUsageDescription` / `RECORD_AUDIO` permission per platform. |
| Privacy warnings on government portal links (CIPC, etc.) | Foundry already shows a "leaving Foundry" confirm dialog. The warning is the third-party site's own; users can safely proceed. |
