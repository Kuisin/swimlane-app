#!/usr/bin/env bash
# Build and sanity-check the vscode-kai-swimlane VSIX.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="${REPO_ROOT}/extensions/vscode-kai-swimlane"
DIST="${EXT_DIR}/dist/extension.js"
VSIX_DIR="${REPO_ROOT}/plugins/vscode"

cd "$REPO_ROOT"
npm run build:extension

if [[ ! -f "$DIST" ]]; then
  echo "error: missing $DIST" >&2
  exit 1
fi

SIZE=$(wc -c <"$DIST" | tr -d ' ')
MIN_SIZE=50000
if [[ "$SIZE" -lt "$MIN_SIZE" ]]; then
  echo "error: $DIST is only ${SIZE} bytes (expected >= ${MIN_SIZE})" >&2
  exit 1
fi
echo "OK: dist/extension.js (${SIZE} bytes)"

npm run package:extension

VERSION="$(node -p "require('${EXT_DIR}/package.json').version")"
VSIX_PATH="${VSIX_DIR}/vscode-kai-swimlane-${VERSION}.vsix"

if [[ ! -f "$VSIX_PATH" ]]; then
  echo "error: missing ${VSIX_PATH}" >&2
  exit 1
fi
echo "OK: packaged $(basename "$VSIX_PATH")"

unzip -l "$VSIX_PATH" | grep -Fq 'extension/dist/extension.js' || {
  echo "error: VSIX missing extension/dist/extension.js" >&2
  exit 1
}
unzip -l "$VSIX_PATH" | grep -Fq 'extension/media/preview.css' || {
  echo "error: VSIX missing extension/media/preview.css" >&2
  exit 1
}
echo "OK: VSIX contains extension.js and preview.css"
