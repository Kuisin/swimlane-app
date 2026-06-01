# Contributing to Kai Swimlane

Thanks for your interest in contributing! This document covers the repository
layout, local development, and the conventions you need to know before opening a
pull request.

## Prerequisites

- Node.js 18+ (the toolchain targets modern ESM and ES2022).
- npm 9+ (the repo uses npm **workspaces**).

## Setup

```bash
npm install      # installs all workspace dependencies
npm run dev      # starts the web editor (Vite)
npm test         # runs the @kai-swimlane/core test suite (vitest)
```

## Repository layout

```
packages/
  core/                 @kai-swimlane/core — parser, themes, diagram renderers
  kai-swimlane/         React preview for the ```kai-swimlane fence
  kai-swimlane-parts/   React preview for the ```kai-swimlane-parts fence
extensions/
  vscode-kai-swimlane/  VS Code / Cursor extension source
plugins/                Packaged extension output and the Cursor local plugin
apps/
  web/                  Vite editor UI + dev-only LLM PNG API
scripts/                Build / codegen / packaging helpers
```

All diagram logic lives in **`@kai-swimlane/core`**; everything else is a thin
layer on top of it.

## Two renderers — and how to keep them in sync

The core ships **two** renderers that must produce identical output:

1. **React renderer** — [`packages/core/src/diagram/diagram.jsx`](packages/core/src/diagram/diagram.jsx).
   This is the source of truth and the only file you edit by hand.
2. **Pure string renderer** — [`packages/core/src/render-pure/diagram.js`](packages/core/src/render-pure/diagram.js).
   Dependency-free (no React); used for headless/server rendering and external
   plugins via the `@kai-swimlane/core/render-pure` entry point. **It is
   auto-generated — do not edit it by hand.**

After changing `diagram.jsx`, regenerate the pure renderer:

```bash
node scripts/generate-diagram-pure.mjs
```

The parity test (`packages/core/src/render-pure/parity.test.js`) renders both
and asserts byte-for-byte equality after normalization, so `npm test` will fail
if you forget to regenerate. A separate test
(`render-pure/native-esm.test.js`) imports the generated module under Node's
native ESM loader to catch problems that vitest's esbuild transform hides (e.g.
duplicate exports).

Icon path data is likewise generated:

```bash
node scripts/generate-icon-paths.mjs   # regenerates render-pure/icon-paths.js from lucide-react
```

## Tests

```bash
npm test                          # all core tests
npm test -- parity                # a single file by name (vitest filter)
```

Please add a regression test for any bug fix or behavior change. Diagram
behavior can be asserted against the rendered SVG string from
`@kai-swimlane/core/render-pure` (see the existing `terminals.test.js`).

## Building the IDE extension

```bash
npm run package:extension     # builds and packages the .vsix into plugins/vscode/
npm run package:cursor-plugin # also bundles the Cursor local plugin zip
```

See [docs/PLUGIN.md](docs/PLUGIN.md) for the full plugin workflow.

## Publishing the npm packages

The library packages are currently marked `private` so they are not published by
accident. To publish, set the desired `version`, set `"private": false` on the
package you want to release, and ensure the npm scope/name is owned by your org.
Note that the packages publish their `src` directory directly (ESM, no build
step), so consumers need a bundler/transpiler for the JSX entry points; the
`@kai-swimlane/core/render-pure` entry point needs none.

## Commit / PR conventions

- Keep changes focused; one logical change per commit.
- Run `npm test` (and `npm run lint` for web changes) before pushing.
- Reference the issue you are addressing in the PR description.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
