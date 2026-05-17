#!/usr/bin/env bash
# Zip plugins/cursor/kai-swimlane/ (must already include vscode/*.vsix).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="${REPO_ROOT}/plugins/cursor/kai-swimlane"
VSCODE_DIR="${PLUGIN_DIR}/vscode"

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('${REPO_ROOT}/extensions/vscode-kai-swimlane/package.json').version")"
fi

shopt -s nullglob
VSIX=("${VSCODE_DIR}"/vscode-kai-swimlane-*.vsix)
shopt -u nullglob

if [[ ${#VSIX[@]} -eq 0 ]]; then
  echo "error: no VSIX in ${VSCODE_DIR}. Run: npm run bundle:cursor-plugin" >&2
  exit 1
fi

OUT="${REPO_ROOT}/kai-swimlane-cursor-plugin-${VERSION}.zip"
rm -f "$OUT"
(cd "${REPO_ROOT}/plugins/cursor" && zip -rq "$OUT" kai-swimlane)
echo "Created: $OUT"
echo "Includes VSIX: $(basename "${VSIX[0]}")"
