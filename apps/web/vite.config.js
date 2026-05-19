import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(rootDir, "../..");

function llmRoutePlugin() {
  let llmHandlerMod;
  return {
    name: "swimlane-llm-routes",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "/";
        if (!llmHandlerMod) {
          try {
            llmHandlerMod = await server.ssrLoadModule("/src/server/llm-handler.js");
          } catch (error) {
            console.error("[swimlane-llm-routes] Failed to load LLM handler:", error);
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({
                success: false,
                error: "LLM server module failed to load. Check the dev server console.",
              })
            );
            return;
          }
        }
        const handled = await llmHandlerMod.handleLlmRoute(req, res, url, server.config.base);
        if (!handled) next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), llmRoutePlugin()],
  base: "/swimlane-app/",
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@kai-swimlane/core": path.join(repoRoot, "packages/core/src/index.js"),
      "kai-swimlane": path.join(repoRoot, "packages/kai-swimlane/src/index.js"),
      "kai-swimlane-parts": path.join(
        repoRoot,
        "packages/kai-swimlane-parts/src/index.js"
      ),
    },
  },
  ssr: {
    external: ["sharp"],
    noExternal: ["@kai-swimlane/core", "kai-swimlane", "kai-swimlane-parts"],
  },
});
