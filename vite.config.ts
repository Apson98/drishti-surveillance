import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import { viteSingleFile } from 'vite-plugin-singlefile'

// npm run dev            website on :5173, API on :4000 (proxied)
// npm run build          production website -> dist/, served by `npm start`
// npm run build:preview  one self-contained HTML file used for the Claude preview
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), glsl({ compress: true }), ...(mode === 'single' ? [viteSingleFile()] : [])],
  define: { __PREVIEW__: JSON.stringify(mode === 'single') },
  server: {
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
}))
