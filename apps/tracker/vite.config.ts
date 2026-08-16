import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      name: 'SLTracker',
      fileName: () => 'tracker.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
  },
  server: {
    port: 5173,
  },
});
