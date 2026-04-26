import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration
 * Sets up the React plugin and defines path aliases for cleaner imports (e.g., '@/components/...')
 */
export default defineConfig({
  // './' base required for Capacitor mobile builds (relative asset paths)
  base: process.env.TAURI_ENV_TARGET_TRIPLE !== undefined ? '/' : './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Prevent Vite from obscuring Rust/Tauri errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port
    port: 1420,
    strictPort: true,
  },
  build: {
    // Tauri on Windows uses Chromium; drop old targets
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
