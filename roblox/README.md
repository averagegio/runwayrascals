# Roblox place (Rojo + Rokit + Wally)

Luau source for Rascal Runways. **Install & MCP:** [`../SETUP.md`](../SETUP.md). Play Solo / IDs: [`../docs/ROBLOX.md`](../docs/ROBLOX.md).

```bash
# from this directory (Rokit must already be installed)
rokit install
wally install
rojo sourcemap default.project.json --output sourcemap.json
rojo plugin install    # once
rojo serve
```

Or `bash scripts/setup.sh`. Then Rojo plugin → Connect → Play.

Pins: `rokit.toml` (Rojo 7.7.0, Wally 0.3.2). Packages: `wally.toml`. Config IDs: `src/ReplicatedStorage/Shared/Config.lua` (create on **this universe** only; `0` until pasted). Monetization rules: [`../docs/MONETIZATION.md`](../docs/MONETIZATION.md).

