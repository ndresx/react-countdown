import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve the library to local source so the examples always track the
      // current repo code (live HMR, no build/publish step needed).
      'react-countdown': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
});
