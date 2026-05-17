#!/usr/bin/env bash
# Copy the latest built VSIX from plugins/vscode/ into the Cursor plugin vscode/ folder.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_VSCODE="${REPO_ROOT}/plugins/cursor/kai-swimlane/vscode"
VSIX_DIR="${REPO_ROOT}/plugins/vscode"

VERSION="$(node -p "require('${REPO_ROOT}/extensions/vscode-kai-swimlane/package.json').version")"
VSIX_SRC="${VSIX_DIR}/vscode-kai-swimlane-${VERSION}.vsix"

if [[ ! -f "$VSIX_SRC" ]]; then
  echo "error: missing ${VSIX_SRC}. Run: npm run package:extension" >&2
  exit 1
fi

mkdir -p "$PLUGIN_VSCODE"
rm -f "$PLUGIN_VSCODE"/vscode-kai-swimlane-*.vsix
cp "$VSIX_SRC" "$PLUGIN_VSCODE/"
echo "Bundled: $PLUGIN_VSCODE/$(basename "$VSIX_SRC")"
