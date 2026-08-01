import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
    // `build` handles npm run build; Vite's dev server separately uses
  // `optimizeDeps` (esbuild) to prebundle dependencies. Both must retain TLA.
  build: { target: 'esnext' },
  // Use React's modern JSX runtime so JSX files don't need `import React`.
  esbuild: { target: 'esnext', jsx: 'automatic' },
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
