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
- Supports branch syntax: `if (...) than (...)`, `elseif (...)`, `else`, `endif`.
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

/block/
<warn>
background-color: #fee2e2;
text-color: #7f1d1d;
border-color: #b91c1c;
shape: cloud;
icon: #alert-triangle;

/line/
sales: Receive order;
if (In stock?) than (yes)
ops: Pack item;
elseif (no)
ops: Backorder; <warn>
else
:;
endif
sales: Notify customer;

@end
```

## Notes

- Parser and rendering are intentionally lightweight and local (no backend).
- The app currently uses JavaScript/JSX (not TypeScript).
