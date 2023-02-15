import vueI18n from "@intlify/vite-plugin-vue-i18n";
import vue from "@vitejs/plugin-vue";
import { basename } from "path";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import pages from "vite-plugin-pages";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  plugins: [
    vue(),
    vueI18n(),
    pages({
      moduleId: "virtual:stories",
      dirs: [{ dir: "src/stories", baseRoute: "story" }],
      extensions: ["story.vue"],
      extendRoute: (route) => {
        const storyBaseName = basename(route.component as string, ".vue");
        return {
          ...route,
          path: route.path.replace(".story", ""),
          meta: {
            isStory: true,
            storyTitle: routeNameToStoryTitle(route.name),
            storyMdPath: `../../stories/${storyBaseName}.md`,
          },
        };
      },
    }),
  ],
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
    target: "es2020",
  },
  optimizeDeps: {
    include: ["complex-matcher"],
    esbuildOptions: {
      target: "es2020",
    },
  },
});

function routeNameToStoryTitle(routeName?: string) {
  if (routeName == null) {
    return "(Untitled Story)";
  }

  return routeName
    .replace(/^story-/, "")
    .replace(/\.story$/, "")
    .split("-")
    .map((s) => `${s.charAt(0).toUpperCase()}${s.substring(1)}`)
    .join(" ");
}
