# Rascal Runways → Roblox

## What exists today (web) vs what Roblox still needed

Inspected on `main` (Fashion Week runner + clip-share PRs already merged).

### Exists (HTML / API)

- Subway Surfers-style **3-lane Fashion Week runner** (`gameplay.js`) — NY / Milan / Paris / London / Berlin / Miami
- Designer shows, rare goals, dress-on-contact, Easy→Impossible (`shows-data.js`, PR #1, #2, #5)
- Three.js avatars, gaits, character create / wardrobe (`character-3d.js`, PRs #16–#20)
- Stripe boutique + Neon auth (`server/`, PRs #3, #22, #23)
- In-run **screenshot + ~15s clip share** to X / TikTok / IG (`clip-share.js`, PR #27)
- iOS WKWebView wrapper (`ios/`)
- Pitch / waitlist / investor docs — web-first, App Store “next”, **no Roblox**

### Missing for a Roblox experience (before this scaffold)

- No Luau, Rojo, or Studio place
- No `RemoteEvent` / `RemoteFunction` netcode
- No `DataStoreService` (web uses Postgres + JWT)
- No `MarketplaceService` Game Passes / Developer Products (web uses Stripe USD)
- No multiplayer lobby, spectate, rematch vote, or `SocialService` invites
- No Roblox capture (`CaptureService`) — clip-share is canvas `MediaRecorder`
- Monetization & IP: web boutique names real houses; Roblox needs **original Rascal houses** (or real licenses)

This folder is the incremental path: a **playable Open Cast vertical slice** George can sync into Studio, plus docs for IDs, live-ops, and DevEx.

## Open in Roblox Studio (first hour)

1. Create an experience on [create.roblox.com](https://create.roblox.com) (place for Rascal Runways).
2. Install **Rojo 7** ([rojo.space](https://rojo.space/docs/v7/getting-started/installation/)) and the [Rojo Studio plugin](https://github.com/rojo-rbx/rojo).
3. Optional toolchain pin:

   ```bash
   cd roblox
   # https://github.com/LPGhatguy/aftman
   aftman install
   ```

4. From `roblox/`:

   ```bash
   rojo serve
   ```

5. In Studio: open a **new Baseplate** (or your place) → Plugins → **Rojo** → **Connect**.
6. Press **Play**. You should get:
   - RR splash (`ReplicatedFirst`)
   - Generated lobby + 3-lane catwalk (`ArenaService`)
   - HUD (phase timer, looks, rematch / spectate / invite / share / boutique)
   - Auto-join **Open Cast** tutorial round (~45s run + pose) aimed at a first finish under two minutes
   - A/D or swipe lanes, W jump, S slide; neon orbs = looks, dark blocks = paparazzi

7. File → Save to Roblox (publish the place). Enable **Studio access to API services** (Game Settings → Security) so `DataStoreService` and `MarketplaceService` work in Play Solo.

`default.project.json` maps:

| Disk | Roblox |
| --- | --- |
| `src/ReplicatedStorage` | `ReplicatedStorage` (Shared + Net) |
| `src/ServerScriptService` | `ServerScriptService` |
| `src/StarterPlayer/StarterPlayerScripts` | client controllers |
| `src/ReplicatedFirst` | loading splash |
| `src/StarterGui`, `src/ServerStorage` | notes only — HUD/arena are Lua-built |

Do **not** Rojo-sync the repo root (HTML/JS). Always serve from `roblox/`.

## After Play works — Creator Dashboard

IDs in `src/ReplicatedStorage/Shared/Config.lua` are `0` on purpose. `Config.isConfiguredId` skips prompts until you paste real numbers.

1. **Monetization → Passes** — create the four Game Passes in [`MONETIZATION.md`](MONETIZATION.md); paste IDs.
2. **Monetization → Developer Products** — coins + listed look pack + spotlight VFX.
3. **Badges** — First Walk, Show Complete, 7-day streak (optional).
4. **Game Settings → Monetization** — enable Premium Payouts (Engagement-based).
5. Turn on **HTTP requests** if you later webhook the web API (already `HttpService.HttpEnabled = true` in the project file).

## Architecture (real APIs only)

```
Client                         Server
 HUD / Input / Share / Spectate
   RemoteEvent Input        →  RoundService (authority: score, crash, collect)
   RemoteEvent RequestJoin  →  contestants + Fast Cast skip
   RemoteFunction GetData   →  DataService GetAsync/UpdateAsync
   RequestPromptPass/Product→  MarketplaceService.Prompt*
                               ProcessReceipt → grant coins/looks
   RequestInvite            →  SocialService:PromptGameInvite
   CaptureService (client)  →  RequestShare toast (TikTok/IG/X off-platform)
```

- **DataStores:** `RascalRunways_Player_v1` via `GetDataStore` / `UpdateAsync`. Unpublished Studio often errors — session cache still lets you Play.
- **Fair play:** scoring is `Shared/Scoring.lua` + `Balance.json`. Passes never multiply speed, rare rate, or score.
- **IP:** Roblox catalog uses House Nightfall / Crest / Concrete / Silk / Oblique. Web analog IDs are comments only.

## Suggested Studio art next (not in this PR)

- Replace `ArenaService.build()` parts with a modeled NYFW catwalk (keep attribute `StartZ` / `FinishZ` / `LaneSpacing`).
- Avatar looks as `Accessory` / layered clothing instead of neon orbs.
- Per-city places + `TeleportService:TeleportAsync` when you outgrow one place.
- UGC Limiteds once the account is in the Creator program ([docs](https://create.roblox.com/docs/marketplace)).

## Tests without Studio

From repo root:

```bash
npm test
```

Checks project paths, tutorial duration &lt; 120s, scoring numbers, and that Luau files reference real services.
