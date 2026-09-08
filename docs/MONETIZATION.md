# Monetization — Rascal Runways (Roblox)

Fair, ToS-safe, aimed at **DevEx** (Robux → USD) plus **Premium Payouts**. Web Stripe boutique stays on the HTML game; do **not** double-charge the same SKU across platforms without a clear entitlement story.

## How Roblox creators actually get paid

| Channel | What it is | How this game uses it |
| --- | --- | --- |
| **Game Passes** | One-time Robux unlock, `MarketplaceService:UserOwnsGamePassAsync` / `PromptGamePassPurchase` | VIP, queue skip, closet slots, director cam |
| **Developer Products** | Repeatable Robux, `PromptProductPurchase` + **`ProcessReceipt`** (must return `PurchaseGranted` / `NotProcessedYet`) | Coins, listed look pack, pose VFX |
| **Premium Payouts** | Roblox pays you for **engagement by Premium subscribers** (time in experience, not a pass you sell) | Daily coin bump + VIP lounge so Premium players linger / rematch |
| **UGC / Limiteds** | Avatar items on the Marketplace (separate from in-experience passes). Limiteds need Creator eligibility | Later: RR glasses, clutch, tote as catalog items — **not** implemented as fake APIs |
| **DevEx** | Cash out Robux after Roblox’s creator payout thresholds & region rules ([Creator payouts](https://create.roblox.com/docs/production/monetization)) | Volume from passes + products + Premium time; keep sessions long and D1/D7 healthy |

Roblox’s cut on in-experience sales is material (plan ~30%+ platform share; always check current docs). Price in Robux, not USD.

**Do not** sell third-party trademarks (Balenciaga, Dior, etc.) as Roblox items without a license. This scaffold uses **House Nightfall / Crest / Concrete / Silk / Oblique**. Licensed drops are a later B2B path (same as the pitch deck “brand collabs”).

## Game Passes (worth it, not P2W)

Create in Creator Dashboard → Monetization → Passes. Paste IDs into `Config.GamePasses.*.id`.

| Key | Suggested Robux | Player-facing | Fair-play rule |
| --- | --- | --- | --- |
| `FrontRowVIP` | 399 | VIP lounge pad, gold nametag, extra daily coins, exclusive pose | **No** speed, magnet, or score multiplier |
| `FastCast` | 99 | Skip Open Cast lobby wait | Same round rules |
| `WalkInCloset` | 199 | 8 saved outfits vs 3 | Cosmetics storage |
| `DirectorCam` | 149 | Extra spectate / replay cameras | Flex, not power |

VIP may bundle Fast Cast convenience (already coded: `skipsQueue` is Fast Cast **or** VIP). Still no race advantage.

## Developer Products (consumable)

`ProcessReceipt` is in `MonetizationService.lua`. Grants are idempotent via `PlayerData.receipts[PurchaseId]`. If the player is gone, return `NotProcessedYet` so Roblox retries.

| Key | Suggested Robux | Grant |
| --- | --- | --- |
| `CoinsS` | 49 | 200 coins |
| `CoinsM` | 129 | 600 coins |
| `CoinsL` | 249 | 1,400 coins (best rate — standard IAP ladder) |
| `SpotlightVfx` | 75 | One-time pose share VFX (cosmetic) |
| `NightfallPack` | 175 | **Listed** items (cathedral boots + finale). Not a random crate |

Avoid paid **random** items unless you implement Roblox’s paid random item disclosure. A listed pack is the safe v1.

Coins spend later on original looks in an in-world boutique (HUD lists products now; a coin shop UI can come after IDs exist).

## Premium benefits (Payouts, not a fake “Premium Game Pass”)

```lua
player.MembershipType == Enum.MembershipType.Premium
```

| Benefit | Why |
| --- | --- |
| +25% coins from shows and dailies | Soft economy bump |
| Same scoring as non-Premium | Fair play |
| Hang in VIP lounge / rematch | **Session time** is what Premium Payouts reward |

Do not gate the first win or tutorial behind Premium.

## Engagement loops TikTok creators actually push

These feed both UGC and DevEx (more days played → more pass impressions):

1. **Clip the pose / wipeout** — Share moment (`CaptureService`) + web clip-share already targeting TikTok/IG/X.
2. **First win in one sitting** — Open Cast + web Quick Run. Creators can duet a 45s first show.
3. **Rematch bait** — “one more walk” in 12s intermission.
4. **Invite overlay** every score screen (`PromptGameInvite`).
5. **Daily streak** — miss a day, lose the D7 drop (login reward, not a paywall).
6. **Drop calendar** — real Fashion Week weeks; limited-time original look (timed shop, not a false Limited API).
7. **Creator codes later** — affiliate Game Pass attribution if/when you add an attribute string on prompts (Dashboard + `PromptGamePassPurchase`).

## Economy sketch (not a forecast)

Illustrative mix after IDs are live (mirrors the pitch “commerce not ads-first” without copying Stripe SKUs):

- ~50% Game Passes (VIP + closet)
- ~30% coin products
- ~15% look packs
- ~5% Premium Payouts early (grows with session length)

Tune `Balance.json` `coinsDivisor` so a typical show grants ~50–80 coins; a look costs a few shows **or** a small product. If coins are too cheap, Dev Products die; too expensive, kids feel paywalled.

## ToS / policy checklist

- [x] No score/speed P2W in code (`Scoring.lua` has no pass multipliers)
- [x] Receipt idempotency
- [x] Unconfigured ID `0` never sent to `PromptProductPurchase`
- [ ] Age rating / paid random disclosure if you add crates later
- [ ] Privacy policy URL on the experience
- [ ] Original cosmetics only until licenses exist
- [ ] Enable Premium Payouts in Game Settings
- [ ] Publish place + API services before testing DataStores / purchases in Studio

## Web Stripe vs Roblox Robux

Keep them **separate entitlements** for v1:

- Web `owned_items` (Neon) ≠ Roblox `ownedLooks` (DataStore)
- Cross-grant later via `HttpService` + signed user mapping if you want “bought on web, wear on Roblox” — that’s a follow-up, not this scaffold
