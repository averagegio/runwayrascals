# Monetization — Rascal Runways (Roblox)

Fun first. Cash later. Web Stripe boutique stays on the HTML game — **separate entitlements** from Robux.

**Do not** sell third-party trademarks (Balenciaga, Dior, etc.) on Roblox without a license. Catalog = **House Nightfall / Crest / Concrete / Silk / Oblique**.

## Rules we will not break

1. **Fun before funnel.** Tight loop is theme → dress → runway → **vote**. Ads and hard shops wait until D1/D7 retention is real.
2. **Cosmetic VIP only** — closet, makeup, poses, nametags. **No win multipliers** on votes, score, speed, rare rate, or place.
3. **Price ladder (DTI-style reference, not a contract):** ~**799** permanent VIP Game Pass · ~**299** monthly (Dev Product → DataStore expiry) · giftable monthly VIP / props.
4. **Style Points** (soft) buy meaningful **free** looks. **Robux** buys exclusivity, time-savers, seasonals. Free players stay competitive via **skill + layering**.
5. **Live-ops:** weekly theme / drop from UTC week index. **No fake scarcity timers** (“ends in 3:00!!” on a fake clock).
6. **Share Links from day one** for TikTok/Shorts attribution + **Creator Rewards** (Active Spender / Audience Expansion). **Engagement-Based Payouts ended July 2025** — do **not** design AFK Premium farms.
7. Prefer **in-experience UGC / IEC** so the fashion catalog and the game monetize together (~**40% experience-owner** pattern where Roblox’s current IEC split applies).
8. **Game Passes and Dev Products are native to this universe.** Cross-game pass sales were disabled ~May 2026. **No donation boards, no AFK grey-area scripts.**

## How money actually hits DevEx (2026)

| Channel | Use here | Do not |
| --- | --- | --- |
| **Game Passes** (`UserOwnsGamePassAsync` / `PromptGamePassPurchase`) | Permanent Front Row VIP (~799), optional à la carte closet/cam | Cross-universe / third-party passes |
| **Developer Products** (`PromptProductPurchase` + `ProcessReceipt`) | Monthly VIP (~299, 30 days in DataStore), giftable VIP/props, seasonal listed looks, queue skip | Random loot crates without disclosure; selling Style Points |
| **Share Links + Creator Rewards** | `Player:GetJoinData()` launch data → store `attributedShareCode`; program tracks Active Spender / Audience Expansion | Pretend EBP still pays for idle Premium time |
| **IEC / in-experience UGC** | Catalog clutch/glasses prompted in-experience when asset IDs exist | Fake Limited APIs |
| **DevEx** | Cash out earned Robux per current Creator payout rules | Donation-game patterns |

Engagement-Based Payouts (**ended July 2025**) are **not** in the model. `MembershipType.Premium` is still readable for UX (badge, thank-you) but **must not** multiply votes, score, or Style Points.

## Funnel (retention before ads)

```
Theme (weekly) → Dress (owned + Style Point looks) → Runway → Vote → Rematch / Share Link
```

First session: Open Cast tutorial, first finish &lt; ~2 minutes (`Balance.retention`). No shop interstitial before the first vote. Boutique is an intermission button, not a gate.

## Game Passes (this universe only)

Create **on this experience** in Creator Dashboard. Paste IDs into `Config.GamePasses.*.id` (`0` = unconfigured, never prompted).

| Key | Hint Robux | What you get | Fair play |
| --- | --- | --- | --- |
| `FrontRowVIP` | **799** (DTI-style permanent) | Closet slots, makeup slots, exclusive poses, gold tag | **Zero** vote/score/speed multiplier |
| `WalkInCloset` | 199 | À la carte extra outfit slots if they skip full VIP | Storage only |
| `DirectorCam` | 149 | Spectate / replay cameras | Flex, not power |
| `FastCast` | 99 | Skip lobby wait | Time-saver; same votes |

VIP **does not** include extra votes. Queue skip is convenience, not placement.

## Developer Products

Idempotent `ProcessReceipt` in `MonetizationService.lua`. Monthly VIP writes `vipUntilUnix`. Gifts use a pending target UserId from `RequestGift` (buyer pays, giftee is granted).

| Key | Hint Robux | Grant |
| --- | --- | --- |
| `VipMonthly` | **299** | +30 days Front Row cosmetics (`vipUntilUnix`) |
| `GiftVipMonthly` | 299 | Same, to a selected friend (DTI-style gift) |
| `GiftPropClutch` | 75 | Giftable clutch prop (cosmetic) |
| `SeasonalLook` | 175 | **This week’s listed drop** (LiveOps theme) — not a loot box, not a fake countdown |
| `FastCastTicket` | 25 | One-time queue skip if they don’t own the pass |
| `SpotlightVfx` | 75 | Pose share VFX (cosmetic) |
| `NightfallPack` | 175 | Listed exclusive look (Robux track) |

**Do not** sell Style Points for Robux. Soft currency is earned in-round so free players can complete looks.

## Style Points (soft)

- Earned from shows + votes + daily streak (`Scoring.stylePointsForScore` — **no Premium/VIP multiplier**).
- Spend on `Catalog` rows with `track = "stylePoints"` (street, house tees, layering pieces).
- Robux / IEC track: `track = "robux"` or `track = "iec"` (exclusives, seasonals).
- Free players remain competitive: voting is skill + layering, not paywalled slots on the runway.

## Live-ops

`Shared/LiveOps.lua` picks the weekly theme from UTC week index (stable, honest). Shop copy: “This week’s theme,” not a ticking fake expire. When the week rolls, the next drop is live. No countdown UI that implies scarcity the systems don’t have.

## Share Links + Creator Rewards

From day one:

1. Experience Share Links (Creator Dashboard) for TikTok / Shorts bios.
2. On join, `DataService.captureShareAttribution(player)` reads `player:GetJoinData().LaunchData` (and `ReferredByPlayerId` when present).
3. Store `attributedShareCode` once (first-touch). Used later for Creator Rewards **Active Spender** / **Audience Expansion** reporting — not for vote weight.

## IEC / UGC

When the group can publish UGC, paste catalog asset IDs into `Config.Iec.assets` and prompt with `MarketplaceService:PromptPurchase` / in-experience catalog APIs **from this experience**. Target the current experience-owner IEC cut (~40% where applicable; confirm live Creator docs). Fashion items worn in the runway **and** sold on the avatar shop is the point.

## Policy checklist

- [x] No vote/score/speed P2W (`Scoring.lua`, `MonetizationService.isVip` cosmetics only)
- [x] No Premium Style Point multiplier (EBP ended Jul 2025)
- [x] Receipt idempotency; ID `0` never prompted
- [x] Native-universe passes/products only
- [x] No donation/AFK scripts in this repo
- [ ] Create passes/products **on this universe**; disable any old cross-game links
- [ ] Share Links enabled in Dashboard; test `LaunchData` on a join
- [ ] IEC asset IDs when UGC is approved
- [ ] Age rating / paid-random disclosure only if crates are added later (v1: listed packs only)

## Web Stripe vs Roblox Robux

v1: Neon `owned_items` ≠ DataStore `ownedLooks`. No cross-grant until a signed mapping exists.

## DataStore (`RascalRunways_Player_v2`)

Session cache still works in unpublished Studio. Old `coins` blobs migrate to `stylePoints` on read.

| Field | Purpose |
| --- | --- |
| `stylePoints` | Soft currency earned in-round / daily. Never granted from Robux. |
| `ownedLooks` | Unlocked catalog IDs (free / Style Points / Robux / IEC). |
| `vipUntilUnix` | Monthly Front Row expiry (Dev Product). Permanent VIP is the Game Pass. |
| `queueSkipTickets` | Fast Cast tickets. Consumed only when joining a **Lobby**. |
| `attributedShareCode` | First-touch Share Link / `LaunchData` (64 chars). |
| `referredByUserId` | `GetJoinData().ReferredByPlayerId` when present. |
| `receipts` | `ProcessReceipt` idempotency keyed by `PurchaseId`. |
| `daily` / `streak` | UTC day grant — same Style Points for VIP and free. |

Receipt store: `RascalRunways_Receipts_v1` (reserved; v1 also stamps receipts on the player blob).
