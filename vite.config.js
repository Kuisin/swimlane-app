import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function llmRoutePlugin() {
  let llmHandlerMod
  return {
    name: 'swimlane-llm-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/'
        if (!llmHandlerMod) {
          llmHandlerMod = await server.ssrLoadModule('/src/server/llm-handler.js')
        }
        const handled = await llmHandlerMod.handleLlmRoute(req, res, url, server.config.base)
        if (!handled) next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), llmRoutePlugin()],
  base: '/swimlane-app/',
  ssr: {
    external: ['sharp'],
  },
})
