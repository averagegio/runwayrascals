# Publishing Rascal City to Roblox (one Studio session)

Everything below happens on your laptop in one sitting. The code is merged
to `main` and pushed — Studio is the only remaining step.

## Before you start

```bash
git pull origin main
cd roblox
rokit install && bash scripts/setup.sh   # first time only
rojo serve
```

## In Studio

1. **Open the EXISTING place, not a new one.** File → Open from Roblox →
   select the rascalrunways place (ID `77428346462225`). This is the
   critical step: publishing to this place upgrades the live game in place.
   Creating a new experience would split your players and wipe their saved
   data.
2. Plugins → **Rojo** → **Connect** (default port 34872). The world syncs in.
3. **Play Solo walkthrough** (from `WORLD.md`):
   - Spawn on Central Plaza (fountain, arch, selfie spot visible).
   - Walk Grand Avenue to Fashion Week Hall — tutorial round auto-starts.
   - After the show you return to the plaza (city → show → city).
   - Enter each district — a toast names the district + house.
   - Enter the Boutique — Try On a look, buy one with Style Points.
   - Check the SS27 Trend Drop wall renders all 10 pieces.
   - If anything looks broken or ugly, stop here and tell Zero — do not publish.
4. **Publish:** File → Publish to Roblox → select the same rascalrunways
   place → Publish. Players get Rascal City on their next join.

## Two things to know before players arrive

- **Robux purchases won't work yet.** Every game pass / developer product ID
  in `Config.lua` is `0` (Studio mock). Style Points purchases work fine on
  day one. To turn on Robux revenue: Creator Dashboard → rascalrunways
  universe → create the passes/products, paste the real IDs into
  `roblox/src/ReplicatedStorage/Shared/Config.lua`, sync, and publish again.
- **Player data is safe.** The world uses the same universe, so the
  `RascalRunways_Player_v2` DataStore carries over — returning players keep
  their Style Points and looks.

## Rollback

If the live game misbehaves after publish: Creator Dashboard → place →
Version History → revert to the previous version. No code changes needed.
