import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@core-test': fileURLToPath(new URL('./test', import.meta.url)),
      },
    },
    test: {
      globals: true,
      alias: {
        // `placement.js` only declares a `module` entry, which the Node-style resolution used by Vitest ignores
        'placement.js': fileURLToPath(new URL('../../node_modules/placement.js/dist/index.es.js', import.meta.url)),
      },
      projects: [
        {
          extends: true,
          test: {
            include: ['**/*.unit.{test,spec}.ts'],
            name: 'unit',
            environment: 'happy-dom',
            setupFiles: ['./test/setup.ts'],
          },
        },
        {
          extends: true,
          plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
            storybookTest({ configDir: path.join(dirname, '.storybook') }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  })
)
