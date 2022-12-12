/// <reference types="vitest" />
import vueI18n from "@intlify/vite-plugin-vue-i18n";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  plugins: [vue(), vueI18n()],
  define: {
    XO_LITE_VERSION: JSON.stringify(process.env.npm_package_version),
    XO_LITE_GIT_HEAD: JSON.stringify(process.env.GIT_HEAD),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
  build: {
    commonjsOptions: {
      include: [/complex-matcher/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ["complex-matcher"],
  },
  test: {
    globals: true,
    environment: "happy-dom",
    exclude: ["e2e"],
    coverage: {
      reportsDirectory: ".tests-output/coverage",
    },
  },
  root: ".",
});
