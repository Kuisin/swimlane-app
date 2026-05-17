import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

await esbuild.build({
  entryPoints: [path.join(__dirname, "src/extension.js")],
  outfile: path.join(__dirname, "dist/extension.js"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: true,
  external: ["vscode"],
  jsx: "automatic",
  alias: {
    "@kai-swimlane/core": path.join(repoRoot, "packages/core/src/index.js"),
  },
  logLevel: "info",
});
