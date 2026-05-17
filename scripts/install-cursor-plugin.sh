#!/usr/bin/env bash
# Copy Kai Swimlane Cursor plugin to ~/.cursor/plugins/local/kai-swimlane
# and optionally install the bundled VSIX for Markdown preview.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${REPO_ROOT}/plugins/cursor/kai-swimlane"
DEST="${1:-${HOME}/.cursor/plugins/local/kai-swimlane}"

if [[ ! -f "${SRC}/.cursor-plugin/plugin.json" ]]; then
  echo "error: missing ${SRC}/.cursor-plugin/plugin.json" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"
echo "Copied Cursor plugin to: $DEST"

VSIX=""
shopt -s nullglob
for f in "$DEST"/vscode/vscode-kai-swimlane-*.vsix; do
  VSIX="$f"
done
shopt -u nullglob

if [[ -z "$VSIX" ]]; then
  shopt -s nullglob
  for f in "${REPO_ROOT}"/plugins/vscode/vscode-kai-swimlane-*.vsix; do
    mkdir -p "$DEST/vscode"
    cp "$f" "$DEST/vscode/"
    VSIX="$DEST/vscode/$(basename "$f")"
    echo "Copied VSIX into plugin: $VSIX"
    break
  done
  shopt -u nullglob
fi

if [[ -n "$VSIX" ]]; then
  if command -v cursor >/dev/null 2>&1; then
    cursor --install-extension "$VSIX" && echo "Installed VSIX via cursor CLI."
  elif command -v code >/dev/null 2>&1; then
    code --install-extension "$VSIX" && echo "Installed VSIX via code CLI."
  else
    echo "Install the VSIX manually: $VSIX"
    echo "  Cursor: Extensions → Install from VSIX…"
  fi
else
  echo "No VSIX found. Build one with: npm run package:extension"
  echo "Or download from GitHub Releases."
fi

echo "Restart Cursor or run Developer: Reload Window."
