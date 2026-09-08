#!/usr/bin/env bash
# Build a Studio-openable place file (gitignored binary).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
if ! command -v rojo >/dev/null 2>&1; then
	echo "rojo is not on PATH. Run: bash scripts/setup.sh"
	exit 1
fi
rojo build default.project.json -o build/RascalRunways.rbxl
echo "Open in Studio: File → Open → $(pwd)/build/RascalRunways.rbxl"
echo "Or keep using: rojo serve  → plugin Connect"
