# Assets — placeholders

Every image here is a plain square placeholder, not final art. Replace each
with real artwork at the same file name and size before release.

| File | Size | What it is for | Used by |
|---|---|---|---|
| `icon.png` | 1024×1024, no transparency | The app icon on iOS, and the fallback icon everywhere else | `app.json` → `expo.icon` |
| `android-icon-foreground.png` | 512×512, transparent background | The front layer of the Android adaptive icon: the logo itself. Keep the artwork inside the centre two-thirds, because Android crops the edges into a circle, squircle or other shape | `app.json` → `expo.android.adaptiveIcon.foregroundImage` |
| `android-icon-background.png` | 512×512, no transparency | The back layer of the Android adaptive icon, drawn behind the foreground | `app.json` → `expo.android.adaptiveIcon.backgroundImage` |
| `android-icon-monochrome.png` | 432×432, transparent background | The single-colour version Android uses for themed icons (Android 13+). Only the shape matters; Android recolours it | `app.json` → `expo.android.adaptiveIcon.monochromeImage` |
| `favicon.png` | 48×48 | The browser-tab icon, used only if the app is run on the web | `app.json` → `expo.web.favicon` |
| `splash-icon.png` | 1024×1024, transparent background | The image for the launch (splash) screen. Not wired up yet: nothing in `app.json` refers to it | nothing yet |

`app.json` also sets `expo.android.adaptiveIcon.backgroundColor` to `#EFEFEF`,
the colour shown if the background image is missing.
