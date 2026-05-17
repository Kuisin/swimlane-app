---
name: open-preview-test
description: Open the Kai Swimlane markdown preview sample and verify fence rendering
---

# Open preview test

## Install preview extension (required)

Markdown preview renders diagrams only when the VSIX is installed:

```bash
# From kai-swimlane repo root
npm run package:cursor-plugin   # build VSIX into plugins/cursor/kai-swimlane/vscode/
npm run install:cursor-plugin   # copy plugin + install VSIX via cursor/code CLI
```

Then **Developer: Reload Window**.

## Verify

1. Open `extensions/vscode-kai-swimlane/samples/preview-test.md`.
2. Run **Markdown: Open Preview** (`Cmd+Shift+V` / `Ctrl+Shift+V`).
3. Confirm fences render as SVG diagrams with a collapsible **DSL** section:
   - `kai-swimlane` (full diagram, with and without `@kai-swimlane` markers)
   - `kai-swimlane-parts` (block/prop gallery)
4. Change **Kai Swimlane: Theme** in settings; preview should refresh.

If preview shows plain code blocks, install or enable the VSIX and reload.

## Markdown Preview Enhanced / PDF

- **MPE:** Command Palette → **Kai Swimlane: Set Up Markdown Preview Enhanced**, then use MPE preview or PDF export.
- **Markdown PDF:** Command Palette → **Kai Swimlane: Embed Diagrams for PDF Export**, then export the generated `*.kai-export.md`.
