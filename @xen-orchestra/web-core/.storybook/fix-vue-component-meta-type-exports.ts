import { createRequire } from 'node:module'

type Checker = {
  getExportNames: (componentPath: string) => string[]
  getComponentMeta: (componentPath: string, exportName?: string) => unknown
}

/**
 * `vue-component-meta` lists every export of an SFC, types included, but can only describe the ones
 * that have a value declaration: `getComponentMeta()` throws on an `export type`. The Storybook
 * plugin maps over the whole list inside a single `try`/`catch`, so one exported type is enough to
 * leave the component with no docgen at all — no prop table, and no `slots` category, which is what
 * tells the Vue renderer to pass slot args as slots instead of as plain attributes.
 *
 * Around 37 web-core SFCs export their types (`UiButton.vue` exports `ButtonVariant`,
 * `ButtonAccent`…), so this drops the export names the checker cannot describe before the plugin
 * ever sees them. It has to run before Storybook loads the framework preset, which is what imports
 * these factories.
 */
const require = createRequire(import.meta.resolve('@storybook/vue3-vite/package.json'))

const componentMeta = require('vue-component-meta')

for (const factoryName of ['createChecker', 'createCheckerByJson'] as const) {
  const createUnfilteredChecker = componentMeta[factoryName]

  componentMeta[factoryName] = (...args: unknown[]) => {
    const checker: Checker = createUnfilteredChecker(...args)
    const listEveryExportName = checker.getExportNames.bind(checker)

    checker.getExportNames = componentPath =>
      listEveryExportName(componentPath).filter(exportName => {
        try {
          checker.getComponentMeta(componentPath, exportName)

          return true
        } catch {
          return false
        }
      })

    return checker
  }
}
