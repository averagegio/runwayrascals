# Rascal City — World Design

Rascal Runways is no longer just a runway arena. It's a **persistent fashion
world**: a night-lit city where players spawn, explore six fashion districts,
shop the flagship Boutique, hang out on Central Plaza, and walk to Fashion
Week Hall when a show starts. The round loop (lobby → theme → dress → runway
→ vote) is untouched — the city wraps around it, so the game loop becomes
**city → show → city**.

This matches the brand promise: *real seasons, real city, real boutique,
real fun.*

## Layout

All coordinates are studs on the XZ plane (see `Config.World`). The Fashion
Week venue built by `ArenaService` stays at origin; the city grows south.

```
                        z=225   [Berlin · Logo Street]   [Miami · Club Silk]
                                        |                     |
                        z=160   [Paris · Book Tote]      [London · Uptown Polo]
                                        |                     |
                        z=95    [New York · Dark Cath.]  [Milan · Book Tote]
                                        |                     |
                        z=175                       .-~~~-.
                        plaza  . . . AVENUE . . .  ( CENTRAL )
                        z=148                       `-~~~-`   [BOUTIQUE ★]
                                        |
                        z=58       FASHION WEEK HALL (venue gate)
                                        |
                        z=0..-160       RUNWAY (existing arena)
```

- **Central Plaza** (0, 175, r=42): spawn point, tiered fountain, RR arch,
  selfie spot, lamp ring, benches. The social heart.
- **Grand Avenue** (z 52→148): connects the venue gate to the plaza;
  sidewalks, neon center dashes, street lamps.
- **Six districts**, one per `Config.Cities` entry, index-aligned:
  west column New York / Paris / Berlin, east column Milan / London / Miami.
  Each has 3 buildings with neon window bands in the house accent color,
  a gateway arch (`CITY · Show Name`), lamps, planters, and a bench.
- **Flagship Boutique** (-48, 170): full interior shell with entrance facing
  the plaza, stocked by `BoutiqueService`.
- **Cross streets** at z = 95 / 160 / 225 link the district rows to the avenue.

| District | City | House | Show name |
|---|---|---|---|
| West N | New York | nightfall | Dark Cathedral |
| East N | Milan | oblique | Book Tote Finale |
| West M | Paris | oblique | Book Tote Finale |
| East M | London | crest | Uptown Polo |
| West S | Berlin | concrete | Logo Street |
| East S | Miami | silk | Club Silk |

## Systems

### WorldService (`Services/WorldService.lua`)
Builds everything procedurally at server start: calls `ArenaService.build()`
for the venue, then the city. Moves the existing `LobbySpawn` (same name, new
home on the plaza) so `RoundService` needs zero changes — players spawn in the
city and `releaseCharacter` returns them here after every show. Publishes
`ReplicatedStorage.WorldDistricts` (one `StringValue` per district:
`name|showName|cx|cz|half`) for the client.

### SeasonService (`Services/SeasonService.lua`)
Real seasons from the calendar month (`Config.Seasons`) — honest, no fake
timers. Applies seasonal decor (one folder per season, current one visible),
a lighting tint shift, and particles:

| Season | Months | Dressing |
|---|---|---|
| Spring | Mar–May | Blossom trees, petal particles |
| Summer | Jun–Aug | Beach umbrellas on the plaza |
| Autumn | Sep–Nov | Amber trees, leaf piles, leaf particles |
| Winter | Dec–Feb | Snowfall, snow drifts, string lights |

Broadcasts `SeasonChanged` to all clients (season + this week's theme);
late joiners get it via `SeasonService.sendTo` in `Bootstrap`.

### BoutiqueService (`Services/BoutiqueService.lua`)
Stocks the boutique interior: one display stand per house look (the
Style-Points piece + the Robux finale piece from `Catalog`). Each stand has
a mannequin, a price sign, and two ProximityPrompts:

- **Try On** — free, applies the look temporarily via `LookVisuals`.
- **Buy** — Style Points → `DataService.buyLookWithStylePoints` (earned,
  never sold); Robux → `MonetizationService.promptProduct` using this
  universe's product IDs only; earn-in-play looks point at the Hall.

Also builds the checkout counter and the "THIS WEEK" drop sign driven by
`LiveOps.theme()`. Cosmetic only — nothing here touches votes, score, or
speed, per the monetization rules in `docs/MONETIZATION.md`.

### DistrictController (`Controllers/DistrictController.lua`)
Client-side: polls the character position against `WorldDistricts` bounds and
toasts on crossing (`— MILAN · Book Tote Finale —`); announces season changes
from `SeasonChanged`. Wired in `ClientBootstrap`.

## Playtest (Studio)

On George's machine (Studio MCP is not on the cloud agent):

```bash
cd roblox
rokit install && bash scripts/setup.sh
rojo serve              # Rojo plugin → Connect in Studio → Play Solo
```

Play Solo checklist:
1. Spawn on Central Plaza (fountain, arch, selfie spot visible).
2. Walk the avenue to Fashion Week Hall — tutorial round auto-starts.
3. After the show, you return to the plaza (city → show → city).
4. Walk into each district — toast names the district + house.
5. Enter the Boutique — Try On a look, buy one with Style Points
   (Studio mock marketplace grants it; nothing persists).
6. `SeasonService.current(os.time{...})` — or change your system month —
   to preview each season's dressing.

## Notes & next

- Part budget is modest (~600 parts + ~40 lights); keep an eye on mobile.
- NPC shopkeepers / paparazzi on streets: `StudioCastService` is the hook.
- Future: player apartments above the boutique, photo-contest spot payouts
  via the selfie spot, district ownership events.
