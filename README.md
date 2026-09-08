# Rascal Runways

Fashion endless runner — dress the look, dodge paparazzi, race Fashion Week.

Live web game: [rascalrunways.com](https://rascalrunways.com) · Roblox place in [`roblox/`](roblox/) · [Play on Roblox](roblox.html) from the home screen.

## What’s in this repo

| Track | Stack | Status |
| --- | --- | --- |
| **Web game (live)** | Static HTML/CSS/JS canvas runner + Three.js avatars, Vercel serverless Express, Neon Postgres, Stripe boutique, clip-share to X/TikTok/IG, Swift WKWebView wrapper | Shipped |
| **Roblox** | Rojo + Luau: lobby → theme → dress → runway → vote, DataStores, cosmetic VIP, Style Points, Share Links, Studio Play Solo arena | In this repo — `rojo serve` then Play; home CTA **Play on Roblox** |

The HTML game stays the production web surface. Roblox is the same IP on a round-based place you can Press Play in Studio — not a half-ported rewrite.

## Web (current loop)

1. Home (`index.html`) — Play, Quick Run, **Play on Roblox**, Sign up, Wardrobe, Fashion Week
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

Toolchain (Rokit → Rojo + Wally → Studio + Cursor MCP): **[`SETUP.md`](SETUP.md)** — do this on George’s machine; Studio MCP is not live on the cloud agent.

Place source, round loop, monetization:

- [`roblox/`](roblox/) — `default.project.json`, Luau, `rokit.toml`, `wally.toml`
- [`docs/ROBLOX.md`](docs/ROBLOX.md) — Play Solo checklist, Creator Dashboard IDs
- [`docs/GAMEPLAY.md`](docs/GAMEPLAY.md) — onboarding, scoring, rematch / spectate / share
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md) — cosmetic VIP ladder (~799 / ~299), Style Points, IEC, Share Links / Creator Rewards (EBP ended Jul 2025)

```bash
cd roblox
rokit install && bash scripts/setup.sh
rojo serve              # then Rojo plugin → Connect in Studio
```

From repo root: `npm run roblox:setup` · `npm test`


## Tests

```bash
npm test
```

Validates Rojo paths, first-win timing (including vote), Style Points scoring (no Premium/VIP multipliers), native-universe SKU hints, and that Luau calls real `MarketplaceService` / `DataStoreService` / `SocialService` / `CaptureService` / `GetJoinData` APIs.
