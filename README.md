# Kai Swimlane

A DSL-based swimlane diagram editor built with React + Vite, organized as an npm workspaces monorepo so the web app and markdown fence renderers share one parser and diagram implementation.

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
    └── web/                  @kai-swimlane/web — Vite editor UI + dev LLM PNG API
```

Shared logic lives in **`@kai-swimlane/core`**. The **`kai-swimlane`** and **`kai-swimlane-parts`** packages are thin React layers on top of that core (used by the web app help/templates tab and reusable in other markdown UIs).

## IDE plugin (VS Code / Cursor)

Build a shareable `.vsix` and install it in VS Code or Cursor:

```bash
npm install
npm run package:extension
```

Full steps: [docs/PLUGIN.md](docs/PLUGIN.md).

**Cursor local plugin** (rules + skill, copy to `~/.cursor/plugins/local/kai-swimlane`):

```bash
npm run install:cursor-plugin
```

See [plugins/cursor/kai-swimlane/README.md](plugins/cursor/kai-swimlane/README.md).

**CI:** pushing a tag `v*` runs [.github/workflows/extension-release.yml](.github/workflows/extension-release.yml), bundles the `.vsix` into `plugins/cursor/kai-swimlane/vscode/`, and attaches the standalone VSIX plus Cursor plugin zip to GitHub Releases.

## Run

From the repository root:

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview -w @kai-swimlane/web
```

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

While **`npm run dev`** is running, the Vite dev server exposes an HTTP API so tools can turn **DSL text** into a **PNG** without using the browser UI. This is **not** available from `npm run preview` or a static GitHub Pages deploy.

The app is served under the Vite **`base`** path ([`apps/web/vite.config.js`](apps/web/vite.config.js)): **`/swimlane-app/`**.

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/swimlane-app/llm/` | JSON with `success: true` and `endpoints`. |
| `POST` | `/swimlane-app/llm/png` | Request body = full DSL (`@kai-swimlane` … `@end`). Response is JSON with `success` and `pngBase64` or `error`. |

Implementation: [`apps/web/src/server/llm-handler.js`](apps/web/src/server/llm-handler.js) (uses `@kai-swimlane/core` for parse + render).

## DSL quick reference

Sections: `/title/`, `/role/`, `/block/`, `/prop/`, `/line/`

```txt
@kai-swimlane

/title/
Order Process

/role/
<sales>
label: Sales;

/line/
[sales: Receive order]

@end
```

See [`apps/web/src/help.md`](apps/web/src/help.md) for the full syntax guide.
