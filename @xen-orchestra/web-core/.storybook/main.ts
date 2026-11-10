import './fix-vue-component-meta-type-exports.ts'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/vue3-vite'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

/**
 * `resolvedReact` is a preset from `@storybook/addon-docs`, which renders the documentation pages
 * with React. It defaults to the React hoisted at the root of the monorepo, which is the React 15
 * that `xo-web` depends on, so it has to be pointed at the copy installed in this package instead.
 */
type StorybookConfigWithReact = StorybookConfig & {
  resolvedReact: { react: string; reactDom: string }
}

const config: StorybookConfigWithReact = {
  stories: ['../lib/**/*.stories.ts'],
  addons: [
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {
      docgen: 'vue-component-meta',
    },
  },
  resolvedReact: {
    react: getAbsolutePath('react'),
    reactDom: getAbsolutePath('react-dom'),
  },
}

export default config
