import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Em desenvolvimento/celular, o front e a API ficam na mesma origem:
// o Vite encaminha /api/* para a API local. Isso elimina CORS e faz o
// cookie de refresh funcionar também no celular.
const API_TARGET = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000';

const apiProxy = {
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  server: { host: true, port: 5173, proxy: apiProxy },
  preview: { host: true, port: 4173, proxy: apiProxy },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fluentify — Inglês com IA',
        short_name: 'Fluentify',
        description: 'Plano de estudos personalizado, correção de fala e revisão espaçada com IA.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
