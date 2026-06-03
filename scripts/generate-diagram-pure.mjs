#!/usr/bin/env node
/**
 * Transforms packages/core/src/diagram/diagram.jsx into render-pure/diagram.js
 * using esbuild JSX → h() factory (pure SVG strings).
 *
 * Run: node scripts/generate-diagram-pure.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let esbuild;
try {
  esbuild = require("esbuild");
} catch {
  esbuild = require(path.join(
    root,
    "extensions/vscode-kai-swimlane/node_modules/esbuild",
  ));
}
const srcPath = path.join(root, "packages/core/src/diagram/diagram.jsx");
const outPath = path.join(root, "packages/core/src/render-pure/diagram.js");

let source = fs.readFileSync(srcPath, "utf8");

source = source
  .replace(
    /import \{ truncate, truncateToColumns, wrapDescriptionToVisualLines, wrapTextToDisplayColumns \} from "\.\.\/utils\.js";/,
    'import { truncate, truncateToColumns, wrapDescriptionToVisualLines, wrapTextToDisplayColumns } from "../utils.js";',
  )
  .replace(
    /import \{ buildStepRowDisplayInfo \} from "\.\.\/parser\.js";/,
    'import { buildStepRowDisplayInfo } from "../parser.js";',
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\.\/branch-rows\.js";/,
    `import {
  findNextFlowStepAfterBranchEnd,
  findNextSiblingBranchStart,
} from "../branch-rows.js";`,
  )
  .replace(
    /import \{ StepShape \} from "\.\/step-shape";/,
    `import { StepShape } from "./step-shape.js";
import { BlockIcon } from "./block-icon.js";
import { h, Fragment } from "./svg-utils.js";`,
  )
  .replace(/import \{ BlockIcon \} from "\.\/block-icon";\n/, "")
  .replace("export function Diagram(", "export function renderDiagramSvg(");

const header = `// Auto-generated from diagram/diagram.jsx by scripts/generate-diagram-pure.mjs
// Do not edit manually — re-run the script after changing diagram.jsx.

import { truncate, truncateToColumns, wrapDescriptionToVisualLines, wrapTextToDisplayColumns } from "../utils.js";
import { buildStepRowDisplayInfo } from "../parser.js";
`;

const { code } = await esbuild.transform(source, {
  loader: "jsx",
  format: "esm",
  jsxFactory: "h",
  jsxFragment: "Fragment",
  target: "es2022",
});

// esbuild already re-exports BRANCH_COLOR_STYLES via the trailing `export { … }`
// block, so we must NOT re-add `export` to the inline const — doing so produces
// a duplicate export that breaks native-ESM consumers (e.g. external plugins).
const stripped = code
  .replace(/^import \{[\s\S]*?\} from "\.\.\/branch-rows\.js";\n?/m, "")
  .replace(/^import \{[\s\S]*?\} from "\.\.\/arrow-line\.js";\n?/m, "")
  .replace(/^import \{ StepShape \} from "\.\/step-shape\.js";\n/m, "")
  .replace(/^import \{ BlockIcon \} from "\.\/block-icon\.js";\n/m, "")
  .replace(/^import \{ h, Fragment \} from "\.\/svg-utils\.js";\n/m, "");

const imports = `import {
  findNextFlowStepAfterBranchEnd,
  findNextSiblingBranchStart,
} from "../branch-rows.js";
import { arrowLineStrokeProps, stepOutgoingArrowLine } from "../arrow-line.js";
import { StepShape } from "./step-shape.js";
import { BlockIcon } from "./block-icon.js";
import { h, Fragment } from "./svg-utils.js";
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + imports + stripped);
console.log(`Wrote ${outPath}`);
