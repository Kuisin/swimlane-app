#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "./lib/repo-root.mjs";

const src = path.join(REPO_ROOT, "plugins/cursor/kai-swimlane");
const defaultDest = path.join(
  os.homedir(),
  ".cursor",
  "plugins",
  "local",
  "kai-swimlane",
);
const dest = process.argv[2] ? path.resolve(process.argv[2]) : defaultDest;

const pluginJson = path.join(src, ".cursor-plugin/plugin.json");
if (!fs.existsSync(pluginJson)) {
  console.error(`error: missing ${pluginJson}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied Cursor plugin to: ${dest}`);

function findVsix(dir) {
  if (!fs.existsSync(dir)) {
    return null;
  }
  const match = fs
    .readdirSync(dir)
    .find((f) => f.startsWith("vscode-kai-swimlane-") && f.endsWith(".vsix"));
  return match ? path.join(dir, match) : null;
}

let vsix = findVsix(path.join(dest, "vscode"));
if (!vsix) {
  const repoVsixDir = path.join(REPO_ROOT, "plugins/vscode");
  const repoVsix = findVsix(repoVsixDir);
  if (repoVsix) {
    const destVsixDir = path.join(dest, "vscode");
    fs.mkdirSync(destVsixDir, { recursive: true });
    vsix = path.join(destVsixDir, path.basename(repoVsix));
    fs.copyFileSync(repoVsix, vsix);
    console.log(`Copied VSIX into plugin: ${vsix}`);
  }
}

if (vsix) {
  const cli =
    commandExists("cursor") ? "cursor" : commandExists("code") ? "code" : null;
  if (cli) {
    execFileSync(cli, ["--install-extension", vsix], { stdio: "inherit" });
    console.log(`Installed VSIX via ${cli} CLI.`);
  } else {
    console.log(`Install the VSIX manually: ${vsix}`);
    console.log("  Cursor: Extensions → Install from VSIX…");
  }
} else {
  console.log("No VSIX found. Build one with: npm run package:extension");
  console.log("Or download from GitHub Releases.");
}

console.log("Restart Cursor or run Developer: Reload Window.");

function commandExists(name) {
  const pathEnv = process.env.PATH || process.env.Path || "";
  const extensions =
    process.platform === "win32"
      ? [".cmd", ".exe", ".bat", ""]
      : [""];
  for (const dir of pathEnv.split(path.delimiter)) {
    for (const ext of extensions) {
      const candidate = path.join(dir, name + ext);
      if (fs.existsSync(candidate)) {
        return true;
      }
    }
  }
  return false;
}
