import { URL, fileURLToPath } from "url";
import { defineConfig } from "vite";
import vueI18n from "@intlify/vite-plugin-vue-i18n";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueI18n()],
  define: {
    XO_LITE_VERSION: JSON.stringify(process.env.npm_package_version),
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
});
