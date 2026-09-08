# Cursor ↔ Roblox Studio MCP

**This cloud agent does not have Roblox Studio, so Studio MCP is not live here.** Connect it on the machine where George has Studio + Cursor installed.

Official docs: https://create.roblox.com/docs/studio/mcp

## Preferred: Studio Quick Connect (Cursor)

1. Open **Roblox Studio** (latest) with the Rascal Runways place.
2. Open **Assistant**.
3. **… → Manage MCP Servers**.
4. Turn on **Enable Studio as MCP server**.
5. Under **Quick connect**, enable **Cursor**.
6. Confirm the green connected-client indicator in that panel.

Restart Cursor if it does not appear.

## Fallback: project JSON

Official `stdio` configs live in this folder:

| OS | File | Command |
| --- | --- | --- |
| Windows | `mcp.json` (committed default) | `cmd.exe /c %LOCALAPPDATA%\Roblox\mcp.bat` |
| macOS | `mcp.macos.json` | `/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP` |

On a Mac, copy `mcp.macos.json` over `mcp.json` (or merge the `Roblox_Studio` entry into your user MCP config). Linux / this VM: there is no official Studio MCP binary — skip.

After JSON changes, restart Cursor. Verify again under Studio → Assistant → Manage MCP Servers.
