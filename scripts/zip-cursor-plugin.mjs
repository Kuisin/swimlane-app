#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { platform } from "node:os";
import { REPO_ROOT } from "./lib/repo-root.mjs";

const versionArg = process.argv[2];
const extensionPkg = JSON.parse(
  fs.readFileSync(
    path.join(REPO_ROOT, "extensions/vscode-kai-swimlane/package.json"),
    "utf8",
  ),
);
const version = versionArg || extensionPkg.version;

const pluginDir = path.join(REPO_ROOT, "plugins/cursor/kai-swimlane");
const vscodeDir = path.join(pluginDir, "vscode");
const vsixFiles = fs
  .readdirSync(vscodeDir)
  .filter((f) => f.startsWith("vscode-kai-swimlane-") && f.endsWith(".vsix"));

if (vsixFiles.length === 0) {
  console.error(`error: no VSIX in ${vscodeDir}. Run: npm run bundle:cursor-plugin`);
  process.exit(1);
}

const out = path.join(REPO_ROOT, `kai-swimlane-cursor-plugin-${version}.zip`);
if (fs.existsSync(out)) {
  fs.unlinkSync(out);
}

const cursorPluginsDir = path.join(REPO_ROOT, "plugins/cursor");
if (platform() === "win32") {
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -LiteralPath '${pluginDir.replace(/'/g, "''")}' -DestinationPath '${out.replace(/'/g, "''")}'`,
    ],
    { stdio: "inherit" },
  );
} else {
  execFileSync("zip", ["-rq", out, "kai-swimlane"], {
    cwd: cursorPluginsDir,
    stdio: "inherit",
  });
}

console.log(`Created: ${out}`);
console.log(`Includes VSIX: ${vsixFiles[0]}`);
