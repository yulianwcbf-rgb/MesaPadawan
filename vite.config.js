import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built assets load correctly whether the app is served
  // from the domain root (user/org GitHub Pages) or from a project subpath
  // (https://<user>.github.io/<repo>/). Combined with HashRouter this needs no
  // server rewrite rules.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
