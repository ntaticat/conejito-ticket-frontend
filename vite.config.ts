import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // SW también en `npm run dev` para probar push sin build.
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Conejito Ticket',
        short_name: 'Conejito',
        description: 'Panel de administración de tickets',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        theme_color: '#db2777',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // preview hereda este proxy.
  server: { proxy: { '/api': 'http://localhost:5251' } },
})
