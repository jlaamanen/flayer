import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { flayerPlugin } from './src/flayer-plugin';

export default defineConfig({
  plugins: [flayerPlugin, sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  server: {
    host: '0.0.0.0',
    fs: {
      allow: ['..']
    }
  },
  preview: {
    port: 80
  }
});
