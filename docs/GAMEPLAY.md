# Gameplay — Rascal Runways on Roblox

Web runner (`gameplay.js`) is solo, endless-until-rares, Stripe boutique. Roblox adds **rounds, friends, votes, and a first win in under ~2 minutes**.

**Fun before funnel.** Tight loop is Theme → dress → runway → vote. Ads and hard shops wait until D1/D7 retention is real.

## Loop

```
Splash → Lobby (Open Cast, this week's UTC theme)
  → Dress (skipped on first tutorial; street pack on)
  → Countdown 3s
  → Run (tutorial 45s / normal 75s)  3 lanes, jump, slide, collect, paparazzi
  → Pose 8s on the gold platform
  → Vote (tutorial 12s / normal 20s)  one ballot each, no self-vote, no VIP extra votes
  → Score (style + race + pose + votes + finish → Style Points)
  → Intermission: Rematch · Spectate · Invite · Share moment · Boutique
```

Timings live in `roblox/src/ReplicatedStorage/Shared/Balance.json`. Weekly theme: `Shared/LiveOps.lua` (UTC week index — **no fake scarcity timers**).

## Onboarding (D0)

Goal: **first finish without a wipe in under two minutes**.

| Step | Budget | What happens |
| --- | --- | --- |
| Splash | ~2s | RR mark, theme → dress → runway → vote |
| Lobby | 6s | Auto-queue; **Fast Cast** (or a ticket) skips wait — VIP does **not** |
| Countdown | 3s | 3-2-1 |
| Run | 45s | Extra life, 5s start shield, rare target **1**, win on **finish line** (not 3 rares) |
| Pose + vote + score | ~26s | Hold pose, one vote, Style Points, First Walk badge (when ID set) |

Web **Quick Run** (home CTA) mirrors the short first-win: Easy NY + Rick Owens magnet show, skip character/wardrobe/map funnel (`quick-run.js`).

Tutorial paparazzi hits consume the extra life instead of ending the show. No shop interstitial before the first vote.

## Scoring (fair)

`Shared/Scoring.lua` — **no Game Pass / monthly VIP / Premium multipliers**. Engagement-Based Payouts ended July 2025; Premium is a thank-you badge, not an economy lever.

- **Style:** looks × 25 + rares × 120 + pickups × 40
- **Race:** distance + look/rare bonuses + place (1st 300 … 8th 20)
- **Pose:** 0–200 from look depth (flourish, not a paid stat)
- **Vote:** votes received × 80 (one vote per player; VIP never adds ballots)
- **Finish:** +500 if you hit the pose platform
- **Style Points:** `floor(total / 20)` — same for everyone. **Not sold for Robux.**

Win condition (normal): reach the finale **or** hit the rare target. Race place and votes are skill + layering, not Robux.

## Cosmetics progression

- Starter owned: street pack + two house tees (`Catalog.starterOwned`)
- **Style Points** buy `track = "stylePoints"` looks (street, house tees, layering)
- Rare orbs grant looks into `DataStore` `ownedLooks`
- Robux / IEC tracks (`robux`, `iec`) are exclusives, seasonals, time-savers
- Cities unlock in the same order as the web API (`newyork` → … → `miami`) — wire `unlockedCities` to map doors as art lands
- Walk-In Closet / VIP: **8 saved outfits vs 3** — convenience, not power

Free players stay competitive: voting is skill + layering, not paywalled runway slots.

## Social (build on clip-share)

| Web (PR #27) | Roblox scaffold |
| --- | --- |
| Canvas screenshot + 15s `MediaRecorder` | `CaptureService:CaptureScreenshot` |
| Share sheet → X / TikTok / IG | Toast: post the Roblox capture from the device sheet |
| Solo restart | **Rematch** vote → next lobby |
| — | **Spectate** (`CameraSubject` on another contestant) |
| — | **Invite** `SocialService:CanSendGameInviteAsync` + `PromptGameInvite` |
| — | **Share Links** from day one: `GetJoinData().LaunchData` → `attributedShareCode` for Creator Rewards (Active Spender / Audience Expansion) |

Creator hooks: 9:16 stills of the pose, wipeout flashes, “first win” badge. Keep captions short: `Rascal Runways · NY Open Cast · @tag`.

Do **not** design AFK Premium farms. Engagement-Based Payouts ended July 2025.

## Retention (session length, D1/D7)

| Hook | Implementation |
| --- | --- |
| Rematch in 12s | Intermission phase + `RequestRematch` |
| Daily Style Points | `DataService.applyDailyAndStreak` (UTC day key) — **same grant for everyone** |
| D7 | Day-7 bonus Style Points + optional badge |
| Friends | Invite from HUD every intermission |
| Share Links | First-touch attribution on join |
| Live-ops | Weekly UTC theme + listed drop (`LiveOps.lua`). Copy: “This week’s theme,” not a fake countdown |

Session design: a show is ~90s; rematch is one tap. Three shows + boutique browse is a 6–8 minute session without a battle pass. Ads wait until D1/D7 is real (`Balance.retention.adsAfterRetentionOnly`).

## Multiplayer notes

- `minPlayers = 1` so Studio Play Solo completes a show
- Cap 8 walkers; extras spectate (Director Cam pass = nicer cameras, not extra score)
- Server moves a hidden cart and CFrames `HumanoidRootPart` — replace with animations when the rig is in
