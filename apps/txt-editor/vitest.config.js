import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(rootDir, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@kai-swimlane/content": path.join(repoRoot, "content"),
      "@kai-swimlane/core": path.join(repoRoot, "packages/core/src/index.js"),
    },
  },
});
