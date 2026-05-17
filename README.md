# Swinlane App

A DSL-based swimlane diagram editor built with React + Vite.

You write diagram text in the editor panel, and the app parses and renders it as SVG with themes, reusable block styles, branching flow, and export to SVG/PNG.

## Run

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## LLM HTTP API: DSL to PNG (dev server only)

While **`npm run dev`** is running, the Vite dev server exposes an HTTP API so tools (for example a Copilot agent or a script) can turn **DSL text** into a **PNG** without using the browser UI. This is **not** available from `npm run preview` or a static GitHub Pages deploy, because it relies on server middleware.

The app is served under the Vite **`base`** path ([`vite.config.js`](vite.config.js)): **`/swimlane-app/`**. Use that prefix on the URLs below (or call `/llm/...` on the same host without the prefix; both work on the dev server).

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/swimlane-app/llm/` | JSON with `success: true` and `endpoints` (supported `theme` values, response contract). |
| `POST` | `/swimlane-app/llm/png` | Request body = full DSL (including `@kai-swimlane` … `@end`). **Response is always JSON** with a boolean `success` (see below). |

**Response contract (`POST /llm/png`):** `Content-Type: application/json`, HTTP **200** for normal outcomes (including DSL mistakes).

- **`success: true`** — PNG bytes are in **`pngBase64`** (standard base64). **`mimeType`** is `"image/png"`.
- **`success: false`** — **`error`** is a human-readable message (DSL format / markers / parser issues, empty body, bad JSON, etc.). If the parser reported rows, **`errors`** may repeat the same details as `{ line, text, msg }[]`.

The server checks for an empty document, required **`@kai-swimlane`** / **`@end`** lines, then runs the same parser as the app; any parser issue is folded into **`error`**.

**Query:** `theme` — one of `basic`, `washi`, `ink`, `mono` (default: `basic`).

**Body:**

- `Content-Type: text/plain` — raw DSL string.
- `Content-Type: application/json` — `{"dsl": "…"}` (`dsl` must be a string).

**CORS:** `Access-Control-Allow-Origin: *` on these routes so a browser-based agent can call the dev origin.

**Example (curl + jq)** — decode PNG when `success` is true:

```bash
curl -sS -X POST "http://localhost:5173/swimlane-app/llm/png?theme=basic" \
  -H "Content-Type: text/plain; charset=utf-8" \
  --data-binary "@src/sample.txt" \
| jq -r 'if .success then .pngBase64 else .error | halt_error(1) end' \
| base64 -d > diagram.png
```

Simpler check without `jq` — save JSON and inspect `success` / `error`:

```bash
curl -sS -X POST "http://localhost:5173/swimlane-app/llm/png?theme=basic" \
  -H "Content-Type: text/plain; charset=utf-8" \
  --data-binary "@src/sample.txt" \
  -o llm-response.json
```

**Example (JSON body):**

```bash
curl -sS -X POST "http://localhost:5173/swimlane-app/llm/png?theme=ink" \
  -H "Content-Type: application/json" \
  -d "{\"dsl\": \"@kai-swimlane\\n/title/\\nTest\\n/role/\\n<a>\\nlabel: A;\\n/line/\\n[a: Step]\\n@end\"}" \
  -o llm-response.json
```

Implementation: [`src/server/llm-handler.js`](src/server/llm-handler.js) (SSR render + [`sharp`](https://sharp.pixelplumbing.com/) rasterization), wired in [`vite.config.js`](vite.config.js).

## Codebase overview

### Entry and app state

- `src/main.jsx`: mounts the React app.
- `src/App.jsx`: top-level layout and state.
  - Keeps DSL source text (`src`), selected theme (`themeKey`), help modal state.
  - Parses DSL with `parseDSL`.
  - Passes parsed model + selected theme into `Diagram`.

### DSL parsing

- `src/lib/parser.js`: converts DSL text into:
  - `title`
  - `lanes`
  - `rows` (steps + branch markers)
  - `blocks` (reusable block styles)
  - `errors`
- Supports branch syntax: `if (...) is (...) than [#color]`, `elseif (...) than [#color]`, `else`, `endif`. Use `[loop]` at the end of a branch case to draw a back-edge to the if decision instead of the merge node.
- When `#color` is omitted, branch condition blocks keep the current theme defaults.
- Branch body indentation is optional, but two leading spaces are recommended for readability.
- Step lines use bracket form: `[roleId: text]` with optional `<blockId>` at end; optional `label:`, `desc:`, `props:`, `skip;` on following lines (each must end with `;`).
- `/role/`, `/block/`, and `/prop/` property lines must end with `;` (e.g. `label: Sales;`).
- Supports empty step marker: `:;`

### Diagram rendering (core)

- `src/components/diagram/diagram.jsx`: main SVG renderer.
  - Calculates layout geometry (lane width, row height, paddings).
  - Draws title, lane headers/backgrounds, branch diamonds, merge points, arrows.
  - Renders step nodes with per-block/per-lane styling.

### Shape and icon systems

- `src/components/diagram/step-shape.jsx`:
  - step shape renderer (`rounded`, `rect`, `ellipse`, `hex`, `note`, `subroutine`, `cloud`).
- `src/components/diagram/block-icon.jsx`:
  - icon renderer.
  - `#name` syntax resolves to Lucide icon.
  - non-`#` values are rendered as emoji/text glyph.
- `src/lib/icon-registry.js`:
  - Lucide icon registry and lookup helpers.

### UI components

- `src/components/toolbar.jsx`: theme toggle, help button, copy DSL, SVG/PNG export.
- `src/components/editor-panel.jsx`: DSL text editor + parser error list.
- `src/components/help-modal.jsx`: syntax guide modal UI.
- `src/lib/export.js`: SVG serialization + PNG conversion/download.

### Content and styling

- `src/sample.txt`: initial DSL sample loaded at startup.
- `src/help.md`: syntax guide content shown in modal.
- `src/lib/themes.js`: built-in theme tokens.
- `src/index.css`: Tailwind import + base body reset.

## Design customization guide

If you want to change the app look and feel, edit in this order:

1. **Theme tokens** (`src/lib/themes.js`)
   - Change global colors for canvas, grid, stroke, title, lanes, branch, and node defaults.
   - Add new theme objects and they will appear automatically in the toolbar.

2. **Diagram visuals/layout** (`src/components/diagram/diagram.jsx`)
   - Spacing: `laneW`, `rowH`, paddings, header height.
   - Connector style: stroke widths, path shape, arrow markers.
   - Typography in SVG: font size/family/weight for title, lane labels, step labels.
   - Lane header/background opacities and borders.

3. **Node style language** (`src/components/diagram/step-shape.jsx`)
   - Tune existing geometry for each shape.
   - Add new shapes by extending `StepShape` and referencing the new shape value via DSL block definitions.

4. **UI chrome** (`src/App.jsx`, `src/components/toolbar.jsx`, `src/components/editor-panel.jsx`)
   - App shell spacing, panel proportions, button style, modal style.
   - This is where you define editor-vs-preview balance and product branding.

5. **Default showcase** (`src/sample.txt`)
   - Update sample content so first-run visuals match your target style.

## DSL quick reference

Sections:

```txt
/title/
/role/
/block/
/prop/
/line/
```

Example:

```txt
@kai-swimlane

/title/
Order Process

/role/
<sales>
label: Sales;
background-color: #e6f2ff;

<ops>
label: Operations;
background-color: #f5f5f4;

/block/
<warn>
background-color: #fee2e2;
text-color: #7f1d1d;
border-color: #b91c1c;
shape: cloud;
icon: #alert-triangle;

/line/
sales: Receive order;
if (stock) is (yes) than #blue
  ops: Pack item;
elseif (hold) than #gray
  ops: Backorder; <warn>
else
:;
endif
sales: Notify customer;

@end
```

## Notes

- Parser and rendering are intentionally lightweight and local (no production backend for the editor UI).
- The **LLM PNG route** is dev-only middleware (see **LLM HTTP API: DSL to PNG** above); it does not ship with the static build.
- The app currently uses JavaScript/JSX (not TypeScript).
