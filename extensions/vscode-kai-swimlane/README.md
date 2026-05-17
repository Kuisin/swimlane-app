# Kai Swimlane (VS Code / Cursor)

Renders `kai-swimlane` and `kai-swimlane-parts` code fences in:

- The built-in **Markdown preview** ([VS Code markdown extension API](https://code.visualstudio.com/api/extension-guides/markdown-extension))
- **[Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)** (preview and PDF export)
- **Markdown PDF** and similar tools (via an export helper command)

## Supported fences

| Language tag | Content |
|--------------|---------|
| `kai-swimlane` | Full document (`@kai-swimlane` … `@end` optional in fences) |
| `kai-swimlane-parts` | `/block/` and/or `/prop/` fragments |

## Settings

- **Kai Swimlane: Theme** (`kaiSwimlane.theme`) — `basic` | `washi` | `ink` | `mono`

## Markdown Preview Enhanced

MPE uses its own renderer (Crossnote), not VS Code’s `extendMarkdownIt`. Run once:

**Command Palette → `Kai Swimlane: Set Up Markdown Preview Enhanced`**

This writes `~/.crossnote/parser.js` so fences are rendered before MPE parses the document (same idea as built-in Mermaid support in MPE). Then use MPE preview or **Chrome (Puppeteer) / PDF** export as usual.

## PDF export (Markdown PDF, etc.)

Tools like [Markdown PDF](https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf) use their own markdown-it pipeline and do not load VS Code markdown-it plugins.

**Command Palette → `Kai Swimlane: Embed Diagrams for PDF Export`**

Creates a sibling file `*.kai-export.md` with fences replaced by static HTML. Export that file to PDF.

## Development

From the repository root:

```bash
npm install
npm run build:extension
```

Press **F5** in this folder to open an Extension Development Host.

## Package a shareable `.vsix`

From the repository root: `npm run package:extension`

Output: `plugins/vscode/vscode-kai-swimlane-<version>.vsix`

See [docs/PLUGIN.md](../../docs/PLUGIN.md) at the repo root.
