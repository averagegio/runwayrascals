# Rascal Runways

Fashion endless runner — dress the look, dodge paparazzi, race Fashion Week.

Live web game: [rascalrunways.com](https://rascalrunways.com) · this repo also scaffolds the **Roblox** experience.

## What’s in this repo

| Track | Stack | Status |
| --- | --- | --- |
| **Web game (live)** | Static HTML/CSS/JS canvas runner + Three.js avatars, Vercel serverless Express, Neon Postgres, Stripe boutique, clip-share to X/TikTok/IG, Swift WKWebView wrapper | Shipped on `main` |
| **Roblox (this PR)** | Rojo + Luau: lobby → Open Cast runway round, DataStores, Game Passes / Dev Products, Premium, invite + CaptureService share | Scaffold in [`roblox/`](roblox/) — open in Studio next |

The HTML game stays the production surface. Roblox is an incremental place George can `rojo serve` and Press Play — not a half-ported rewrite.

## Web (current loop)

1. Home (`index.html`) — Play, Sign up, Wardrobe, Fashion Week, or **Quick Run**
2. Character → wardrobe → city Fashion Week → designer show → 3-lane runner (`gameplay.js`)
3. Collect looks / rares, dodge paparazzi, share a 9:16 card + ~15s clip (`clip-share.js`)
4. Boutique via Stripe (`server/` + `/api`)

Local:

```bash
python3 -m http.server 8765   # static game
cd server && npm start        # API on :8787
```

Vercel + Neon + Stripe: [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md). iOS wrapper: [`ios/README.md`](ios/README.md).

## Roblox (next playable surface)

Rojo project lives in [`roblox/`](roblox/). Studio setup, round loop, and monetization:

- [`docs/ROBLOX.md`](docs/ROBLOX.md) — install Rojo, sync, Press Play, Creator Dashboard IDs
- [`docs/GAMEPLAY.md`](docs/GAMEPLAY.md) — onboarding, scoring, rematch / spectate / share
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md) — Game Passes, Dev Products, Premium Payouts, DevEx, ToS-safe catalog

```bash
cd roblox
aftman install          # or install Rojo another way
rojo serve              # then Rojo plugin → Connect in Studio
npm test                # from repo root — Balance.json + API-presence checks
```

## Tests

```bash
npm test
```

Validates Rojo paths, first-win timing budget, scoring (no P2W multipliers), and that Luau calls real `MarketplaceService` / `DataStoreService` / `SocialService` / `CaptureService` APIs.
