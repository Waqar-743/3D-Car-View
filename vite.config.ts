import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

const canonicalBase = '/WindWay/';
const legacyBases = ['/3D-Car-Design/', '/3D-Car-View/'];

// Keep existing local bookmarks usable after the GitHub repository rename.
// GitHub Pages itself serves the canonical /WindWay/ deployment.
function legacyPreviewRedirect(): Plugin {
  const redirect = (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const legacy = legacyBases.find((base) => url.pathname === base.slice(0, -1) || url.pathname.startsWith(base));
    if (!legacy) { next(); return; }
    const suffix = url.pathname.slice(Math.min(legacy.length, url.pathname.length));
    response.writeHead(302, { Location: canonicalBase + suffix + url.search, 'Cache-Control': 'no-store' });
    response.end();
  };
  return { name: 'windway-legacy-preview-paths',
    configureServer(server) { server.middlewares.use(redirect); },
    configurePreviewServer(server) { server.middlewares.use(redirect); },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [legacyPreviewRedirect(), react()],
  base: canonicalBase,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@dimforge')) return 'physics';
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
    open: false
  }
})
