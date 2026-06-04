# Kai Swimlane

A DSL-based swimlane diagram editor built with React + Vite, organized as a pnpm workspace monorepo so the web app, Electron txt viewer/editor, and markdown fence renderers share one parser and diagram implementation.

## Repository layout

```
├── packages/
│   ├── core/                 @kai-swimlane/core — parser, themes, SVG diagram, template parsing
│   ├── kai-swimlane/         Full ```kai-swimlane fence preview (React + react-markdown helpers)
│   └── kai-swimlane-parts/   ```kai-swimlane-parts block/prop gallery preview
├── extensions/
│   └── vscode-kai-swimlane/  VS Code extension source (build → plugins/vscode/*.vsix)
├── plugins/
│   ├── vscode/               Packaged .vsix output
│   └── cursor/kai-swimlane/  Cursor local plugin
└── apps/
    ├── web/                  @kai-swimlane/web — Vite editor UI + dev LLM PNG API
    ├── txt-viewer/           Electron app — open a folder of `.txt` DSL files and preview SVG live
    └── txt-editor/           Electron app — GUI editor for `.txt` DSL files on disk (save back to folder)
```

Shared logic lives in **`@kai-swimlane/core`**. The **`kai-swimlane`** and **`kai-swimlane-parts`** packages are thin React layers on top of that core (used by the web app help/templates tab and reusable in other markdown UIs).

## Prerequisites

- **Node.js 18+** (ESM / ES2022; Node 20+ recommended for extension packaging)
- **pnpm 9+** ([install](https://pnpm.io/installation); the repo pins **pnpm@9.15.4** via `packageManager` in [`package.json`](package.json))

From the repository root, install all workspace dependencies once:

```bash
pnpm install
```

## Run

### Web editor (`apps/web`)

```bash
pnpm run dev          # Vite dev server (text + GUI editor, dev LLM PNG API)
pnpm run build        # production build
pnpm run preview      # serve the production build locally
```

The editor is published under the Vite base path **`/swimlane-app/`**:

- **Text editor:** `https://kuisin.github.io/swimlane-app/`
- **GUI editor:** `https://kuisin.github.io/swimlane-app/gui`

Deep links to `/gui` work on GitHub Pages via `apps/web/public/404.html` (SPA fallback).

### Txt Viewer (`apps/txt-viewer`)

Desktop Electron app for **live preview** of Kai Swimlane DSL files saved as `.txt`. Pick a folder (including nested subfolders); every `.txt` file is parsed and rendered to SVG via `@kai-swimlane/core/render-pure`. Edits on disk are picked up automatically (chokidar file watch).

```bash
pnpm --filter txt-viewer start    # launch the app
pnpm --filter txt-viewer dev      # same as start (electron . --dev)
```

Or from the app directory:

```bash
cd apps/txt-viewer
pnpm start
```

**Usage:** **Open Folder** → choose a directory containing `.txt` swimlane DSL files → select a file in the sidebar tree → switch theme (basic / washi / ink / mono) → optional **Show TXT** side panel for raw source.

**Package native installers** (requires platform-specific Electron Builder tooling):

```bash
pnpm --filter txt-viewer build:mac   # macOS .dmg (x64 + arm64)
pnpm --filter txt-viewer build:win   # Windows NSIS installer (x64)
pnpm --filter txt-viewer build:all   # both platforms (on a machine that supports each target)
```

Output lands under `apps/txt-viewer/dist/`.

The main process loads the headless renderer directly from the monorepo core package:

```js
// apps/txt-viewer/electron/main.js — same pipeline as the web editor export path
import { textToSvg } from "../../packages/core/src/render-pure/index.js";
const { svg, errors } = textToSvg(content, { themeKey: "basic" });
```

IPC bridge (`electron/preload.js` → `renderer/renderer.js`): `selectFolder`, `readTxtFiles`, `renderSvg`, `watchFolder`, `onFileChanged`.

### Txt Editor (`apps/txt-editor`)

Desktop Electron app for **GUI editing** of Kai Swimlane DSL files saved as `.txt`. Reuses the web app's GUI editor components (`GuiModePanel`, flow-step list, step inspector, template panels) via a Vite alias to `apps/web/src`. Open a folder tree of `.txt` files, edit in the GUI, and **Save** (or Ctrl+S) to write changes back to disk. Live diagram preview uses the React `Diagram` component from `@kai-swimlane/core`.

```bash
pnpm --filter txt-editor dev       # Vite dev server + Electron (hot reload)
pnpm --filter txt-editor build     # production renderer bundle
pnpm --filter txt-editor preview   # build then launch Electron
pnpm --filter txt-editor start     # launch Electron (requires prior build)
```

Or from the app directory:

```bash
cd apps/txt-editor
pnpm dev
```

**Usage:** **Open Folder** (or **Samples**) → select a `.txt` file in the sidebar tree → edit title, flow steps, branches, and options in the GUI panel → select a step for the inline step inspector → **Save** when the dirty indicator appears. External edits to non-active files are picked up via chokidar.

**Package native installers:**

```bash
pnpm --filter txt-editor build:win   # Windows NSIS installer (x64)
pnpm --filter txt-editor build:mac   # macOS .dmg (x64 + arm64)
```

Output lands under `apps/txt-editor/dist/` (renderer) and platform installers from electron-builder.

IPC bridge (`electron/preload.js` → renderer): `selectFolder`, `readTxtFiles`, `writeTxtFile`, `watchFolder`, `onFileChanged`, `readBundledSamples`.

### Tests and lint

```bash
pnpm test             # @kai-swimlane/core vitest suite
pnpm run lint         # web app ESLint
```

## IDE plugin (VS Code / Cursor)

Build a shareable `.vsix` and install it in VS Code or Cursor:

```bash
pnpm run package:extension
```

Full steps: [docs/PLUGIN.md](docs/PLUGIN.md).

**Cursor local plugin** (rules + skill, copy to `~/.cursor/plugins/local/kai-swimlane`):

```bash
pnpm run install:cursor-plugin
```

See [plugins/cursor/kai-swimlane/README.md](plugins/cursor/kai-swimlane/README.md).

**CI:** pushing a tag `v*` runs [.github/workflows/extension-release.yml](.github/workflows/extension-release.yml), bundles the `.vsix` into `plugins/cursor/kai-swimlane/vscode/`, and attaches the standalone VSIX plus Cursor plugin zip to GitHub Releases.

## Markdown fence plugins

| Fence | Package | Preview |
|-------|---------|---------|
| ` ```kai-swimlane ` | `kai-swimlane` | Full swimlane diagram |
| ` ```kai-swimlane-parts ` | `kai-swimlane-parts` | Blocks and props only |

Example with `react-markdown`:

```jsx
import ReactMarkdown from "react-markdown";
import { createKaiSwimlaneCodeComponent } from "kai-swimlane";
import { createKaiSwimlanePartsCodeComponent } from "kai-swimlane-parts";

const KaiSwimlaneCode = createKaiSwimlaneCodeComponent({ themeKey: "basic" });
const KaiSwimlanePartsCode = createKaiSwimlanePartsCodeComponent({ themeKey: "basic" });

<ReactMarkdown
  components={{
    code(props) {
      const lang = /language-(\S+)/.exec(props.className || "")?.[1];
      if (lang === "kai-swimlane") return <KaiSwimlaneCode {...props} />;
      if (lang === "kai-swimlane-parts") return <KaiSwimlanePartsCode {...props} />;
      return <code {...props} />;
    },
  }}
>
  {markdown}
</ReactMarkdown>
```

Or use the preview components directly:

```jsx
import { KaiSwimlanePreview } from "kai-swimlane";
import { KaiSwimlanePartsPreview } from "kai-swimlane-parts";

<KaiSwimlanePreview code={dsl} themeKey="basic" />
<KaiSwimlanePartsPreview code={blockFragment} themeKey="basic" />
```

## LLM HTTP API (dev server only)

While **`pnpm run dev`** is running, the Vite dev server exposes an HTTP API so tools can turn **DSL text** into a **PNG** without using the browser UI. This is **not** available from `pnpm run preview` or a static GitHub Pages deploy.

The app is served under the Vite **`base`** path ([`apps/web/vite.config.js`](apps/web/vite.config.js)): **`/swimlane-app/`**.

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/swimlane-app/llm/` | JSON with `success: true` and `endpoints`. |
| `POST` | `/swimlane-app/llm/png` | Request body = full DSL (`@kai-swimlane` … `@end`). Response is JSON with `success` and `pngBase64` or `error`. |

Implementation: [`apps/web/src/server/llm-handler.js`](apps/web/src/server/llm-handler.js) (uses `@kai-swimlane/core` for parse + render).

## Web editor

The Vite app (`apps/web`) provides two modes (toolbar links):

| Mode | URL | Purpose |
|------|-----|---------|
| **Text** | `/swimlane-app/` | Edit raw DSL; **Format** normalizes indentation; role/block/prop counts in the status bar |
| **GUI** | `/swimlane-app/gui` | Edit title, flow steps, branches, sections, and side branches; **Settings** writes `/page/` and `/option/` into the DSL |

Shared features: multi-tab documents (browser `localStorage`), **Syntax** dialog (`help.md` + `template.md` catalog), theme picker (basic / washi / ink / mono), export **SVG** / **PNG** / `.txt` DSL, unsaved-change guard on reload. GUI adds **Templates** popups (roles, blocks, props) and a **step inspector** popup for the selected step. On parse errors, GUI offers **fix in text editor** or **continue** (only rows tied to error lines stay locked).

Sample DSL: [`content/complex-test-example.txt`](content/complex-test-example.txt).

## Txt Viewer (Electron)

| Feature | Detail |
|---------|--------|
| **Input** | Any folder tree of `.txt` files (hidden dotfiles skipped) |
| **Preview** | SVG via `textToSvg` from `@kai-swimlane/core/render-pure` |
| **Live reload** | `chokidar` watches add / change / delete under the opened folder |
| **UI** | Collapsible folder tree sidebar, theme picker, optional raw DSL panel |
| **Stack** | Electron 31, plain HTML/CSS/JS renderer (no React in the shell) |

Source layout:

```
apps/txt-viewer/
  electron/
    main.js       Electron main — folder dialog, file I/O, chokidar, SVG IPC
    preload.js    contextBridge API exposed as window.api
  renderer/
    index.html    shell markup
    renderer.js   sidebar tree, SVG pane, theme + TXT toggle
    styles.css    layout and typography
  drive.mjs       optional Playwright helper for automated UI checks (local paths)
```

For headless or server use without Electron, see [Headless rendering](#headless-rendering-for-external-plugins) below.

## Txt Editor (Electron)

| Feature | Detail |
|---------|--------|
| **Input** | Any folder tree of `.txt` files (hidden dotfiles skipped) |
| **Edit** | GUI editor from `apps/web` — title, flow steps, branches, settings, templates |
| **Save** | Explicit **Save** / Ctrl+S writes the active file back to disk; dirty `*` indicator |
| **Blank files** | Empty `.txt` files open as the default DSL template (dirty until saved) |
| **New file** | **新規 .txt** creates a templated `.txt` in the open folder |
| **Preview** | Live React `Diagram` from `@kai-swimlane/core` |
| **Panels** | Drag dividers to resize folder list, editor column, and step inspector; sizes persist in `localStorage` |
| **Live reload** | `chokidar` refreshes non-dirty files when changed externally |
| **Stack** | Electron 31, Vite + React renderer (reuses `apps/web/src` GUI components) |

Source layout:

```
apps/txt-editor/
  electron/
    main.js       folder dialog, file read/write, chokidar
    preload.js    contextBridge API exposed as window.api
  src/
    app.jsx                 main layout (sidebar + diagram + GUI panel)
    context/file-editor-provider.jsx   disk-backed EditorContext
    components/             folder sidebar, step inspector, template modal
    shims/                  Electron replacements for browser-only web helpers
  vite.config.js            aliases @web → apps/web/src, base ./ for file://
```

## DSL quick reference

Wrap documents in `@kai-swimlane` … `@end` (optional inside Markdown ` ```kai-swimlane ` fences).

**Sections:** `/title/`, `/page/`, `/option/`, `/role/`, `/block/`, `/prop/`, `/line/` (`/option/` may be omitted).

```txt
@kai-swimlane

/title/
Order Process

/page/
description: Optional subtitle under the title;
header-center: ACME Corp;

/option/
show-left-gutter: true;
show-right-gutter: true;
left-title: Procedure;

/role/
<sales>
label: Sales;

/line/
[sales: Receive order]
label: Intake;
desc: Customer submits the order.;
remark: Shown in the right column when show-right-gutter is true;

@end
```

**Step metadata** (lines after `[role: text] <block>`): `id:`, `label:`, `desc:`, `remark:`, `remark-desc:`, `skip;`, `arrow: solid|dashed|dotted;`, `props: A,B;` — with inline `**bold**`, `*italic*`, `~~strike~~` in `desc` / `remark` text.

**Flow control** (inside `/line/`):

| Construct | Meaning |
|-----------|---------|
| `if (cond) is (case) than` … `elseif (case) than` … `else` … `endif` | Exclusive branch — exactly one case runs. Renders decision/merge diamonds. Optional `#color` after `than`. |
| `fork` … `and` … `endfork` | Parallel branch — all paths run concurrently. Renders split/join bars. Optional `#color` on `fork` / `and`. |
| `[loop]` | At the end of a case, route back to its own `if` decision (retry). |
| `merge: <id>;` | At the end of a case, route to the step with matching `id: <id>;` downstream instead of the `endif` merge. |
| `section (name) #color` … `end-section` | Visual box around steps; main flow continues through them. |
| `branch (name) #color` … `end-branch` | Side path off the main flow; last step merges to the block after `end-branch` (or the next gateway). |

`/option/` flags include gutters, header/footer/description visibility, `show-step-block-captions`, and `merge-at-previous-block` (join gateways at the previous step). See [`content/help.md`](content/help.md) for the full syntax guide (Japanese).

## Headless rendering (for external plugins)

For tools that need an SVG **without** React (servers, CLIs, other editors'
plugins), import the dependency-free string renderer from the
`@kai-swimlane/core/render-pure` entry point:

```js
import { parseDSL, THEMES } from "@kai-swimlane/core";
import { renderDiagramSvg } from "@kai-swimlane/core/render-pure";

const model = parseDSL(dslText);
const svg = renderDiagramSvg({ model, theme: THEMES.basic });
```

`render-pure` is auto-generated from the React renderer and kept byte-for-byte
identical by a parity test, so both paths produce the same diagram. `react`,
`react-dom`, and `lucide-react` are optional peers — only the React components
exported from the main `@kai-swimlane/core` barrel need them.

## Flow control & limitations

The flow DSL is **block-structured**: every control block (`if` … `endif`,
`fork` … `endfork`, `section` … `end-section`, `branch` … `end-branch`) must be
properly nested. Within that model:

- **Exclusive vs parallel.** `if/elseif/else` picks exactly one case (decision
  + merge diamonds). `fork/and/endfork` runs every path concurrently (split +
  join bars). Use `fork` when steps in different lanes happen at the same time.
- **Section vs branch.** `section` only groups steps in a dashed box; the main
  flow still runs through them in order. `branch` starts a side path (no entry
  arrow on its first step) that merges after `end-branch` into the next main-flow
  block or gateway.
- **Re-convergence.** A case normally rejoins the flow at its `endif`. `[loop]`
  instead routes back to the same decision (retry); `merge: <id>;` routes
  forward to a step with matching `id:`, so cases can reconverge at different points (e.g. a
  cancel path that skips straight to the end).
- **Steps may freely change lanes within a single case** (e.g. `a → c → a → b`);
  connectors route between lanes automatically.
- **Control blocks cannot be interleaved across each other.** Two `if`/`fork`
  blocks are either nested (one inside a case/path of the other) or sequenced
  one after the next — there is no way to weave steps from two sibling blocks
  together. `fork` covers genuine concurrency; `merge` covers a forward jump.
- A flow may **start or end with a branch** (no surrounding step); the start/end
  terminals attach to the gateway in that case.
- Very wide fan-outs (many `elseif`/`and` cases sharing one lane) widen that
  lane to keep cases from overlapping, which can make the diagram broad.
- **Comments:** `//` lines and lines starting with `***` are ignored in `/line/`
  (attached to the next row when formatting). Lines inside `` ``` `` fences in
  `desc:` / `remark:` are literal content, not comments.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, the
`diagram.jsx` → `render-pure` regeneration workflow, and testing conventions.

## License

[MIT](LICENSE) © Kai Swimlane contributors.
