# Kai Swimlane — IDE plugin (VS Code / Cursor)

The shareable plugin file is a **`.vsix`** package built from `extensions/vscode-kai-swimlane/`. It uses the same parser and diagram code as the web app (`@kai-swimlane/core`).

## Prerequisites

- Node.js 20+
- npm (from the repository root)

## 1. Install dependencies

```bash
cd /path/to/kai-swimlane
npm install
```

## 2. Build and create the `.vsix` file

```bash
npm run package:extension
```

Output (version in the filename may differ):

```text
plugins/vscode/vscode-kai-swimlane-0.1.0.vsix
```

`vsce` names the file from the extension `name` and `version` in `package.json`.

### Commands reference

| Command | What it does |
|---------|----------------|
| `npm run build:extension` | Bundle extension → `extensions/vscode-kai-swimlane/dist/extension.js` |
| `npm run package:extension` | Build + run `vsce package` → `.vsix` |

## 3. Share the file

Upload or send the `.vsix` file, for example:

- GitHub Release asset
- Shared drive / chat attachment
- Internal package registry

Recipients do **not** need the full repository—only the `.vsix`.

## 4. Install in VS Code or Cursor

1. Open **Extensions** (`Cmd+Shift+X` / `Ctrl+Shift+X`).
2. Open the **⋯** menu on the Extensions view.
3. Choose **Install from VSIX…** (Cursor: same menu).
4. Select `vscode-kai-swimlane-0.1.0.vsix`.
5. Reload if prompted.

### Command line (optional)

```bash
code --install-extension plugins/vscode/vscode-kai-swimlane-0.1.0.vsix
cursor --install-extension plugins/vscode/vscode-kai-swimlane-0.1.0.vsix
```

## 5. Verify

1. Open or create a `.md` file.
2. Add a fence:

````markdown
```kai-swimlane
/title/
Hello
/role/
<a>
label: A;
/line/
[a: Step one]
```

(`@kai-swimlane` and `@end` are optional inside fences; the extension adds them when missing.)
````

3. Open **Markdown: Open Preview** (`Cmd+Shift+V` / `Ctrl+Shift+V`).
4. You should see the diagram and a collapsible **DSL** section.

For block/prop snippets use ` ```kai-swimlane-parts `.

## 6. Publish to the Marketplace (optional)

1. Create a [publisher](https://marketplace.visualstudio.com/manage) on the Visual Studio Marketplace.
2. Set `"publisher"` in `extensions/vscode-kai-swimlane/package.json` to your publisher id.
3. Run:

```bash
cd extensions/vscode-kai-swimlane
npx vsce login <publisher-id>
npm run package
npx vsce publish
```

Cursor can install extensions from the VS Code Marketplace; Open VSX is a separate registry for VSCodium-style editors.

## Local development (F5)

1. Open `extensions/vscode-kai-swimlane` in VS Code/Cursor.
2. Run `npm run build` in that folder (or `npm run build:extension` from the repo root).
3. Press **F5** → Extension Development Host opens with the plugin loaded.
4. Open a markdown file and preview.

## Bump version before sharing

Edit `"version"` in `extensions/vscode-kai-swimlane/package.json`, then run `npm run package:extension` again so the new `.vsix` has a new filename.

## GitHub Actions (automated release)

On push of a version tag (e.g. `v0.1.0`), the workflow [`.github/workflows/extension-release.yml`](../.github/workflows/extension-release.yml):

1. Builds `vscode-kai-swimlane-<version>.vsix`
2. Copies it into `plugins/cursor/kai-swimlane/vscode/` (`npm run bundle:cursor-plugin`)
3. Zips `plugins/cursor/kai-swimlane/` as `kai-swimlane-cursor-plugin-<version>.zip` (includes the VSIX)
3. Uploads both to **GitHub Releases**

Manual run (artifacts only, no release): **Actions → Release Extension → Run workflow**.

Create a release locally:

```bash
# bump version in extensions/vscode-kai-swimlane/package.json first
git tag v0.1.0
git push origin v0.1.0
```

## Cursor local plugin

Install rules/skills into Cursor:

```bash
npm run package:cursor-plugin      # build VSIX, copy into plugin, zip for release
npm run install:cursor-plugin      # copy to ~/.cursor/plugins/local/kai-swimlane
```

Target path: `~/.cursor/plugins/local/kai-swimlane` (use a real copy, not a symlink).

## Markdown Preview Enhanced and PDF

| Goal | Action |
|------|--------|
| Preview or PDF in **Markdown Preview Enhanced** | Command Palette → **Kai Swimlane: Set Up Markdown Preview Enhanced** (once per machine). |
| PDF via **Markdown PDF** or similar | Command Palette → **Kai Swimlane: Embed Diagrams for PDF Export**, then export the generated `*.kai-export.md` file. |

The built-in preview uses VS Code’s [Markdown extension API](https://code.visualstudio.com/api/extension-guides/markdown-extension) (`markdown.markdownItPlugins`). MPE and many PDF extensions use separate pipelines, like Mermaid does in those tools.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Preview shows plain code block | Reload window; confirm extension is enabled; fence language must be exactly `kai-swimlane` or `kai-swimlane-parts`. |
| MPE / MPE PDF shows plain code | Run **Kai Swimlane: Set Up Markdown Preview Enhanced**; reload MPE preview. |
| Markdown PDF shows plain code | Export from `*.kai-export.md` created by **Embed Diagrams for PDF Export**. |
| `vsce: command not found` | Use `npm run package:extension` from the repo root (uses local `@vscode/vsce`). |
| Build fails on `lucide-react` | Run `npm install` at repo root so workspace deps resolve. |
| Diagram error in preview | Check DSL markers `@kai-swimlane` / `@end` for full diagrams; expand **DSL** in preview for source. |
