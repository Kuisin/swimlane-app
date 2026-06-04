import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devPortPlugin } from "./scripts/dev-port-plugin.js";
import { txtEditorShimsPlugin } from "./scripts/txt-editor-shims-plugin.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(rootDir, "../..");

export default defineConfig({
  plugins: [txtEditorShimsPlugin(), react(), tailwindcss(), devPortPlugin()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: false,
    fs: {
      allow: [repoRoot],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@web": path.join(repoRoot, "apps/web/src"),
      "@kai-swimlane/content": path.join(repoRoot, "content"),
      "@kai-swimlane/core/render-pure": path.join(
        repoRoot,
        "packages/core/src/render-pure/index.js",
      ),
      "@kai-swimlane/core": path.join(repoRoot, "packages/core/src/index.js"),
      "kai-swimlane": path.join(repoRoot, "packages/kai-swimlane/src/index.js"),
      "kai-swimlane-parts": path.join(
        repoRoot,
        "packages/kai-swimlane-parts/src/index.js",
      ),
    },
  },
});
