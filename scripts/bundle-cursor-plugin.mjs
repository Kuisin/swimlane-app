#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./lib/repo-root.mjs";

const extensionPkg = JSON.parse(
  fs.readFileSync(
    path.join(REPO_ROOT, "extensions/vscode-kai-swimlane/package.json"),
    "utf8",
  ),
);

const pluginVscode = path.join(
  REPO_ROOT,
  "plugins/cursor/kai-swimlane/vscode",
);
const vsixDir = path.join(REPO_ROOT, "plugins/vscode");
const vsixName = `vscode-kai-swimlane-${extensionPkg.version}.vsix`;
const vsixSrc = path.join(vsixDir, vsixName);

if (!fs.existsSync(vsixSrc)) {
  console.error(`error: missing ${vsixSrc}. Run: npm run package:extension`);
  process.exit(1);
}

fs.mkdirSync(pluginVscode, { recursive: true });
for (const file of fs.readdirSync(pluginVscode)) {
  if (file.startsWith("vscode-kai-swimlane-") && file.endsWith(".vsix")) {
    fs.unlinkSync(path.join(pluginVscode, file));
  }
}

const vsixDest = path.join(pluginVscode, vsixName);
fs.copyFileSync(vsixSrc, vsixDest);
console.log(`Bundled: ${vsixDest}`);
