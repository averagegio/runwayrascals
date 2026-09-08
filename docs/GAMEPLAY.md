# Gameplay — Rascal Runways on Roblox

Web runner (`gameplay.js`) is solo, endless-until-rares, Stripe boutique. Roblox adds **rounds, friends, and a first win in under ~2 minutes**.

## Loop

```
Splash → Lobby (Open Cast)
  → Dress (skipped on first tutorial; street pack on)
  → Countdown 3s
  → Run (tutorial 45s / normal 75s)  3 lanes, jump, slide, collect, paparazzi
  → Pose 8s on the gold platform
  → Score (style + race + pose + finish bonus → coins)
  → Intermission: Rematch · Spectate · Invite · Share moment · Boutique
```

Timings live in `roblox/src/ReplicatedStorage/Shared/Balance.json`.

## Onboarding (D0)

Goal: **first finish without a wipe in under two minutes**.

| Step | Budget | What happens |
| --- | --- | --- |
| Splash | ~2s | RR mark, “Open Cast starts in seconds” |
| Lobby | 6s | Auto-queue; Fast Cast / VIP skip wait |
| Countdown | 3s | 3-2-1 |
| Run | 45s | Extra life, 5s start shield, rare target **1**, win on **finish line** (not 3 rares) |
| Pose + score | ~14s | Hold pose, coins, First Walk badge (when ID set) |

Web **Quick Run** (home CTA) mirrors this: Easy NY + Rick Owens magnet show, skip character/wardrobe/map funnel (`quick-run.js`).

Tutorial paparazzi hits consume the extra life instead of ending the show.

## Scoring (fair)

`Shared/Scoring.lua` — **no Game Pass / product multipliers**.

- **Style:** looks × 25 + rares × 120 + pickups × 40  
- **Race:** distance + look/rare bonuses + place (1st 300 … 8th 20)  
- **Pose:** 0–200 from look depth (flourish, not a paid stat)  
- **Finish:** +500 if you hit the pose platform  
- **Coins:** `floor(total / 20)`; Premium +25% coins only (not score)

Win condition (normal): reach the finale **or** hit the rare target. Race place is skill + spawn, not Robux.

## Cosmetics progression

- Starter owned: street pack + two house tees (`Catalog.starterOwned`)
- Rare orbs grant looks into `DataStore` `ownedLooks`
- Cities unlock in the same order as the web API (`newyork` → … → `miami`) — wire `unlockedCities` to map doors as art lands
- Walk-In Closet / VIP: **8 saved outfits vs 3** — convenience

## Social (build on clip-share)

| Web (PR #27) | Roblox scaffold |
| --- | --- |
| Canvas screenshot + 15s `MediaRecorder` | `CaptureService:CaptureScreenshot` |
| Share sheet → X / TikTok / IG | Toast: post the Roblox capture from the device sheet (same destinations) |
| Solo restart | **Rematch** vote → next lobby |
| — | **Spectate** (`CameraSubject` on another contestant) |
| — | **Invite** `SocialService:CanSendGameInviteAsync` + `PromptGameInvite` |

Creator hooks (TikTok-style): 9:16 stills of the pose, wipeout flashes, “first win” badge. Keep captions short: `Rascal Runways · NY Open Cast · @tag`.

## Retention (session length, D1/D7)

| Hook | Implementation |
| --- | --- |
| Rematch in 12s | Intermission phase + `RequestRematch` |
| Daily coins | `DataService.applyDailyAndStreak` (UTC day key) |
| D7 | Day-7 bonus coins + optional badge |
| Premium | Daily/coin bonus; keep them in VIP lounge between shows (engagement → Premium Payouts) |
| Friends | Invite from HUD every intermission |
| Live-ops later | Fashion Week calendar aligned to real NYFW / PFW weeks (web pitch already says this) |

Session design: a show is ~90s; rematch is one tap. Three shows + boutique browse is a 6–8 minute session without a battle pass.

## Multiplayer notes

- `minPlayers = 1` so Studio Play Solo completes a show
- Cap 8 walkers; extras spectate (Director Cam pass = nicer cameras, not extra score)
- Server moves a hidden cart and CFrames `HumanoidRootPart` — replace with animations when the rig is in
