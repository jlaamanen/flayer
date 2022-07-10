import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), viteCommonjs()],
  server: {
    port: 9000,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
