# Rascal Runways — iOS (App Store) wrapper

Full-bleed **SwiftUI + WKWebView** shell that loads the production web game. The web UI already uses `viewport-fit=cover`, translucent status bar meta tags, and safe-area CSS — this native host ignores system chrome so the game paints edge-to-edge.

## Create the Xcode project (one-time)

1. Open **Xcode → File → New → Project → App** (iOS).
2. Product Name: `RunwayRascals`, Interface: **SwiftUI**, Language: **Swift**.
3. Replace the generated sources with the files in this folder:
   - `RunwayRascalsApp.swift`
   - `ContentView.swift`
   - `GameWebView.swift`
   - `AppConfig.swift`
   - `Info.plist` (or merge keys into the target Info tab)
4. Set **Bundle Identifier** (e.g. `com.yourstudio.runwayrascals`).
5. Deployment target **iOS 16+** (SwiftUI + modern WKWebView).
6. In **Signing & Capabilities**, select your Team.
7. Build & run on a device or simulator.

### Debug local web build

Serve the repo root:

```bash
python3 -m http.server 4173
```

Then in the Xcode scheme, add environment variable:

```
RUNWAY_URL = http://127.0.0.1:4173/index.html
```

Production default in `AppConfig.swift` is `https://runnwayrascals.vercel.app/`.

## App Store checklist

- Replace placeholder icons in Assets with 1024×1024 marketing icon + asset catalog sizes.
- Screenshots: iPhone 6.7" and 6.1" full-bleed home + gameplay.
- Privacy Policy URL (account / Stripe / photos if you enable camera later).
- Age rating: typically 9+ / 12+ depending on competitive play framing.
- Review notes: explain WKWebView loads your hosted game; demo account if auth is required.
- If you later ship offline/bundled HTML, add the static files as a folder reference and point `AppConfig.gameURL` at `Bundle.main` `index.html`.

## Why WKWebView (not rewrite)

The game is already a tuned HTML Canvas + Three.js runner. This wrapper gets you on TestFlight/App Store quickly with the same full-bleed fashion UI, while keeping one codebase for web + native shell.
