import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Fincontrole',
        short_name: 'Fincontrole',
        description: 'Painel financeiro pessoal — lançamentos, cartões, dívidas e investimentos.',
        theme_color: '#2563eb',
        background_color: '#0b1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precacheia o app shell (HTML/JS/CSS) pra abrir instantâneo e funcionar offline.
        // Dados (transações etc.) continuam vindo da API/IndexedDB — não mexe nisso.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
