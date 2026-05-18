# Kai Swimlane (VS Code / Cursor)

Renders `kai-swimlane` and `kai-swimlane-parts` code fences in the built-in **Markdown preview** ([VS Code markdown extension API](https://code.visualstudio.com/api/extension-guides/markdown-extension)).

## Supported fences

| Language tag | Content |
|--------------|---------|
| `kai-swimlane` | Full document (`@kai-swimlane` … `@end` optional in fences) |
| `kai-swimlane-parts` | `/block/` and/or `/prop/` fragments |

## Settings

- **Kai Swimlane: Theme** (`kaiSwimlane.theme`) — `basic` | `washi` | `ink` | `mono`

Changing the theme refreshes the built-in Markdown preview automatically.

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
