import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: path.resolve(__dirname, '../out/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, '../src/webview/main.ts'),
      output: {
        entryFileNames: 'main.js',
        format: 'iife'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  }
});
