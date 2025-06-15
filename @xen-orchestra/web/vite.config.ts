import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv, PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())

  return {
    base: './',
    plugins: [
      vueRouter({
        routesFolder: [
          'src/pages',
          {
            src: 'src/stories',
            path: 'story/',
            extensions: ['.story.vue'],
          },
          {
            src: '../web-core/lib/stories',
            path: 'story/web-core/',
            extensions: ['.story.vue'],
          },
        ],
        extendRoute(route) {
          const rootPath = '/story'

          if (!route.fullPath.startsWith(rootPath)) {
            return
          }

          let markdownPath = route.component?.replace(/\.vue$/, '.md')

          if (markdownPath !== undefined && !existsSync(markdownPath)) {
            markdownPath = undefined
          }

          const pathParts = route.fullPath.substring(rootPath.length + 1).split('/')

          const label = pathParts[pathParts.length - 1].replace('-', ' ')

          route.addToMeta({
            story: {
              isStory: route.path !== '',
              rootPath,
              pathParts,
              label,
              markdownPath,
            },
          })
        },
        exclude: mode !== 'development' ? ['src/pages/dev/**'] : [],
      }),
      vue(),
      vueI18n({
        include: fileURLToPath(new URL('../web-core/lib/locales/**', import.meta.url)),
      }),
    ] as PluginOption[],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('../web-core/lib', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `ws://${VITE_XO_REST_HOST}`,
          ws: true,
        },
        '/rest': {
          target: `http://${VITE_XO_REST_HOST}`,
        },
      },
    },
  }
})
