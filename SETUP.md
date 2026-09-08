# Rascal Runways — Rokit / Rojo / Wally / Studio MCP

Short toolchain card. Gameplay & monetization: [`docs/ROBLOX.md`](docs/ROBLOX.md). Official Studio MCP: [create.roblox.com/docs/studio/mcp](https://create.roblox.com/docs/studio/mcp).

**Studio MCP is not running on the cloud agent.** Toggle it on George’s PC (Studio + Cursor). This repo is MCP-*ready*.

## 1. Install Rokit

[rojo-rbx/rokit](https://github.com/rojo-rbx/rokit) is the tool manager (replaces Aftman).

```bash
# macOS / Linux
curl -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.ps1 | iex
```

Restart the terminal so `rokit` is on PATH. First install may ask you to **trust** `rojo-rbx/rojo` and `UpliftGames/wally` — that’s expected. Non-interactive:

```bash
rokit trust rojo-rbx/rojo UpliftGames/wally
```

## 2. Install pinned tools (Rojo + Wally)

From the **Roblox project folder**:

```bash
cd roblox
rokit install          # reads rokit.toml → rojo 7.7.0, wally 0.3.2
wally install          # reads wally.toml → Packages/ + ServerPackages/
rojo sourcemap default.project.json --output sourcemap.json
```

Or one script:

```bash
cd roblox && bash scripts/setup.sh
```

From repo root: `npm run roblox:setup` (same script).

`rokit.toml` pins:

| Tool | Spec |
| --- | --- |
| Rojo | `rojo-rbx/rojo@7.7.0` |
| Wally | `UpliftGames/wally@0.3.2` |

## 3. Studio plugin + serve

```bash
cd roblox
rojo plugin install    # once — installs the Rojo Studio plugin
rojo serve             # default.project.json → DataModel
```

In Studio: open a Baseplate (or the published place) → Plugins → **Rojo** → **Connect** → Play.

Do **not** serve from the repo root (HTML/JS). Always `cd roblox`.

## 4. Roblox Studio MCP (Cursor)

Preferred (official 2026 path):

1. Latest **Roblox Studio** on this machine.
2. Assistant → **… → Manage MCP Servers**.
3. Enable **Studio as MCP server**.
4. **Quick connect → Cursor**.

JSON fallback (if Quick connect does not list Cursor):

- Windows — already in [`.cursor/mcp.json`](.cursor/mcp.json):

  `cmd.exe /c %LOCALAPPDATA%\Roblox\mcp.bat`

- macOS — copy [`.cursor/mcp.macos.json`](.cursor/mcp.macos.json) over `.cursor/mcp.json`:

  `/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP`

Restart Cursor. Confirm the green client indicator in Studio’s MCP panel.

## 5. What `default.project.json` maps

| Disk | DataModel |
| --- | --- |
| `src/ReplicatedStorage` + `Packages/` | `ReplicatedStorage` (+ Wally shared packages) |
| `src/ServerScriptService` + `ServerPackages/` | `ServerScriptService` |
| `src/StarterPlayer/StarterPlayerScripts` | client |
| `src/ReplicatedFirst` | RR splash |
| `src/StarterGui`, `src/ServerStorage` | notes; HUD/arena are Luau-built |

## Adding a Wally package later

```bash
cd roblox
wally add <scope/package>@x.y.z
wally install
rojo sourcemap default.project.json --output sourcemap.json
```
