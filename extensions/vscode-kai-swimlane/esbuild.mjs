import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const shared = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: true,
  jsx: "automatic",
  alias: {
    "@kai-swimlane/core": path.join(repoRoot, "packages/core/src/index.js"),
  },
  logLevel: "info",
};

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: [path.join(__dirname, "src/extension.js")],
    outfile: path.join(__dirname, "dist/extension.js"),
    external: ["vscode"],
  }),
  esbuild.build({
    ...shared,
    entryPoints: [path.join(__dirname, "src/html-enhance.js")],
    outfile: path.join(__dirname, "dist/html-enhance.cjs"),
    external: [],
  }),
]);
