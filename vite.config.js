import { defineConfig } from 'vite';

// CashScript/libauth use native WebAssembly helpers and top-level await.
// ESNext keeps those browser-native features intact instead of downlevelling them.
export default defineConfig({
  // `build` handles npm run build; Vite's dev server separately uses
  // `optimizeDeps` (esbuild) to prebundle dependencies. Both must retain TLA.
  build: { target: 'esnext' },
  // Use React's modern JSX runtime so JSX files don't need `import React`.
  esbuild: { target: 'esnext', jsx: 'automatic' },
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' },
  },
});
