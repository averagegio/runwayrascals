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

This folder is the incremental path: a **playable Open Cast vertical slice** George can sync into Studio, plus docs for IDs, live-ops, Share Links, and DevEx. Funnel is **theme → dress → runway → vote**; monetization is cosmetic VIP + Style Points (see [`MONETIZATION.md`](MONETIZATION.md)).

## Open in Roblox Studio (first hour)

Full toolchain (Rokit, Wally, sourcemap, Cursor MCP): **[`../SETUP.md`](../SETUP.md)**.

1. Create an experience on [create.roblox.com](https://create.roblox.com) (place for Rascal Runways).
2. Install **Rokit**, then from `roblox/`: `rokit install` (pins **Rojo 7.7.0** + **Wally**). See [Rojo + Rokit](https://rojo.space/docs/v7/getting-started/installation/).
3. `bash scripts/setup.sh` (Wally packages + `rojo sourcemap`).
4. `rojo plugin install` (once) then `rojo serve`.
5. In Studio: open a **new Baseplate** (or your place) → Plugins → **Rojo** → **Connect**.
6. Press **Play**. You should get:
   - RR splash (`ReplicatedFirst`)
   - Generated lobby + 3-lane catwalk (`ArenaService`) — default **Baseplate is destroyed** so you spawn on the plaza
   - Dressing room, VIP lounge, runway spots, skyline, lobby/pose cameras
   - HUD (phase + weekly theme, Style Points, **dress panel**, vote panel, rematch / spectate / invite / share / boutique)
   - **Studio Play Solo extras** (IsStudio only): two house NPCs (Nightfall / Crest) so vote has a target; 8s dress beat on the tutorial; boutique **mock grants** while IDs are `0`
   - Auto-join **Open Cast** tutorial round (~45s run + pose + vote) aimed at a first finish under two minutes
   - A/D or swipe lanes, W jump, S slide; neon orbs = looks (they tint the avatar); dark blocks = paparazzi
7. Optional: `npm run roblox:build` then File → Open `roblox/build/RascalRunways.rbxl` (binary is gitignored).
8. File → Save to Roblox (publish the place). Enable **Studio access to API services** (Game Settings → Security) so `DataStoreService` and `MarketplaceService` work in Play Solo. Mock grants do **not** replace real IDs on a published place.

On the same machine as Cursor: Studio Assistant → Manage MCP Servers → enable Studio MCP → **Quick connect → Cursor**. This cloud VM does not run Studio MCP.

`default.project.json` maps:

| Disk | Roblox |
| --- | --- |
| `src/ReplicatedStorage` + `Packages/` | `ReplicatedStorage` (Shared + Net + Wally) |
| `src/ServerScriptService` + `ServerPackages/` | `ServerScriptService` |
| `src/StarterPlayer/StarterPlayerScripts` | client controllers |
| `src/ReplicatedFirst` | loading splash |
| `src/StarterGui`, `src/ServerStorage` | notes only — HUD/arena are Lua-built |

Do **not** Rojo-sync the repo root (HTML/JS). Always serve from `roblox/`.

## After Play works — Creator Dashboard

IDs in `src/ReplicatedStorage/Shared/Config.lua` are `0` on purpose. `Config.isConfiguredId` skips prompts until you paste real numbers. Create every pass and product **on this universe** (cross-game sales disabled ~May 2026).

1. **Monetization → Passes** — Front Row VIP (~799), Walk-In Closet, Director Cam, Fast Cast. Paste IDs. Details: [`MONETIZATION.md`](MONETIZATION.md).
2. **Monetization → Developer Products** — monthly VIP (~299), giftable VIP/props, this week’s listed drop, Fast Cast ticket, spotlight VFX, Nightfall pack. **Do not** sell Style Points.
3. **Share Links** — enable from day one for TikTok / Shorts bios. Joins store `LaunchData` via `Player:GetJoinData()` for Creator Rewards **Active Spender** / **Audience Expansion**.
4. **Badges** — First Walk, Show Complete, 7-day streak (optional).
5. **IEC / in-experience UGC** — when the group can publish, paste asset IDs into `Config.Iec.assets` (~40% experience-owner pattern where applicable).
6. Turn on **HTTP requests** if you later webhook the web API (already `HttpService.HttpEnabled = true` in the project file).

Do **not** enable Engagement-Based Payouts / AFK Premium farms (EBP ended July 2025). Do **not** add donation boards.

## Architecture (real APIs only)

```
Client                         Server
 HUD / Input / Share / Spectate / Vote
   RemoteEvent Input        →  RoundService (authority: score, crash, collect, vote)
   RemoteEvent RequestJoin  →  contestants + Fast Cast skip (not VIP)
   RemoteEvent RequestVote  →  one ballot, no self-vote
   RemoteFunction GetData   →  DataService GetAsync/UpdateAsync + share attribution
   RequestPromptPass/Product→  MarketplaceService.Prompt* (this universe only)
   RequestGift              →  pending target + ProcessReceipt (in-server giftee)
                               ProcessReceipt → VIP days / looks / skip tickets
                               (never Style Points for Robux)
   RequestInvite            →  SocialService:PromptGameInvite
   CaptureService (client)  →  RequestShare toast (TikTok/Shorts + Share Links)
   GetJoinData (join)       →  attributedShareCode / referredByUserId
```

- **DataStores:** `RascalRunways_Player_v2` via `GetDataStore` / `UpdateAsync` (`stylePoints`, `vipUntilUnix`, share attribution). Unpublished Studio often errors — session cache still lets you Play. Old `coins` blobs migrate on read.
- **Fair play:** scoring is `Shared/Scoring.lua` + `Balance.json`. Passes never multiply speed, rare rate, votes, or score. VIP is closet / makeup / poses / tags only.
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

Checks project paths, tutorial duration &lt; 120s (including Studio's extra 8s dress), scoring numbers, Play Solo NPC/mock/dress wiring, and that Luau files reference real services.

`npm run roblox:build` writes `roblox/build/RascalRunways.rbxl` when Rojo is installed (file is gitignored).
