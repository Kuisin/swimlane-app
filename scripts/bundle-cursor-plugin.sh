#!/usr/bin/env bash
# Copy the latest built VSIX from plugins/vscode/ into the Cursor plugin vscode/ folder.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_VSCODE="${REPO_ROOT}/plugins/cursor/kai-swimlane/vscode"
VSIX_DIR="${REPO_ROOT}/plugins/vscode"

shopt -s nullglob
VSIX=("${VSIX_DIR}"/vscode-kai-swimlane-*.vsix)
shopt -u nullglob

if [[ ${#VSIX[@]} -eq 0 ]]; then
  echo "error: no VSIX in ${VSIX_DIR}. Run: npm run package:extension" >&2
  exit 1
fi

mkdir -p "$PLUGIN_VSCODE"
rm -f "$PLUGIN_VSCODE"/vscode-kai-swimlane-*.vsix
cp "${VSIX[0]}" "$PLUGIN_VSCODE/"
echo "Bundled: $PLUGIN_VSCODE/$(basename "${VSIX[0]}")"
