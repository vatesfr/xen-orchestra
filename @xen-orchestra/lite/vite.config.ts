import { resolve } from 'path'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  plugins: [
    vue(),
    vueI18n({
      include: resolve(__dirname, '../web-core/lib/locales/**'),
    }),
  ],
  define: {
    XO_LITE_VERSION: JSON.stringify(process.env.npm_package_version),
    XO_LITE_GIT_HEAD: JSON.stringify(process.env.GIT_HEAD),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('../web-core/lib', import.meta.url)),
    },
  },

  // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vue'
            }

            if (id.includes('lodash-es')) {
              return 'lodash-es'
            }

            if (id.includes('echarts')) {
              return 'charts'
            }
          }
        },
      },
    },
    commonjsOptions: {
      include: [/complex-matcher/, /node_modules/],
    },
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['complex-matcher'],
    esbuildOptions: {
      target: 'es2020',
      tsconfigRaw: {
        // https://github.com/vitejs/vite/issues/15201#issuecomment-1875543124
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },
  esbuild: {
    tsconfigRaw: {
      // https://github.com/vitejs/vite/issues/15201#issuecomment-1875543124
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
})
