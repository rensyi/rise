# Assets

`icon.png` is the real app icon. `favicon.png`, `android-icon-foreground.png`
and `android-icon-background.png` are made from it by resizing only; make
them again if the icon changes. `android-icon-monochrome.png` and
`notification-icon.png` are made from one white-on-black silhouette of the
same picture: the black is turned transparent and the result resized.
`splash-icon.png` is the icon again, at two thirds of the canvas and cut to a
circle, because Android shows the launch image through a circle that size.
Nothing here is a placeholder any more.

The Android foreground is the whole icon drawn at two thirds of the canvas,
on the icon's own background colour (`#161210`), because Android crops an
adaptive icon to its middle two thirds. The background layer is that same
colour, so the two join without a seam.

| File | Size | What it is for | Used by |
|---|---|---|---|
| `icon.png` | 1024×1024, no transparency | The app icon on iOS, and the fallback icon everywhere else | `app.json` → `expo.icon` |
| `android-icon-foreground.png` | 512×512, transparent background | The front layer of the Android adaptive icon: the logo itself. Keep the artwork inside the centre two-thirds, because Android crops the edges into a circle, squircle or other shape | `app.json` → `expo.android.adaptiveIcon.foregroundImage` |
| `android-icon-background.png` | 512×512, no transparency | The back layer of the Android adaptive icon, drawn behind the foreground | `app.json` → `expo.android.adaptiveIcon.backgroundImage` |
| `android-icon-monochrome.png` | 432×432, transparent background | The single-colour version Android uses for themed icons (Android 13+). Only the shape matters; Android recolours it | `app.json` → `expo.android.adaptiveIcon.monochromeImage` |
| `favicon.png` | 48×48 | The browser-tab icon, used only if the app is run on the web | `app.json` → `expo.web.favicon` |
| `notification-icon.png` | 96×96, pure white shape on a transparent background | The small icon Android shows in the status bar and beside the wake-up reminder. Android ignores colour and uses only the shape, so lettering and detail are lost | `app.json` → `expo.plugins` → `expo-notifications` → `icon` |
| `widget-preview-log.png` | 300×300 | What Android's widget picker shows for the small **I'm up** widget. Taken from the web mock-up; replace it with a screenshot of the real widget | `app.json` → `expo.plugins` → `react-native-android-widget` → `widgets` |
| `widget-preview-week.png` | 632×300 | The same, for the wide streak widget | as above |
| `splash-icon.png` | 1024×1024, transparent background | The image for the launch (splash) screen, shown centred on `#161210` | `app.json` → `expo.plugins` → `expo-splash-screen` → `image` |

`app.json` also sets `expo.android.adaptiveIcon.backgroundColor` to `#161210`,
the colour shown if the background image is missing.
