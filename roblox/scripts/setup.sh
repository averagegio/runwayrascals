#!/usr/bin/env bash
# Install Rokit-managed tools, Wally packages, and write a Luau LSP sourcemap.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v rokit >/dev/null 2>&1; then
	echo "Rokit is not on PATH."
	echo "Install: https://github.com/rojo-rbx/rokit#installation"
	echo "  macOS/Linux: curl -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash"
	echo "  Windows:     irm https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.ps1 | iex"
	exit 1
fi

rokit install
wally install
# Zero-dependency Wally trees omit these folders; Rojo still $path-maps them.
mkdir -p Packages ServerPackages
if [ ! -e Packages/.gitkeep ]; then
	: > Packages/.gitkeep
fi
if [ ! -e ServerPackages/.gitkeep ]; then
	: > ServerPackages/.gitkeep
fi
rojo sourcemap default.project.json --output sourcemap.json
echo "Toolchain ready. Next: rojo serve  (then Rojo plugin → Connect in Studio)"
