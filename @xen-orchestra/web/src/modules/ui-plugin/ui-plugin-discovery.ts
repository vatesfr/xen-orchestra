import type { UiPluginManifest } from '@/modules/ui-plugin/types/ui-plugin.type.ts'

/**
 * Returns the UI plugins to load.
 *
 * For now, they are declared at build time with `VITE_XO_UI_PLUGINS`, a comma-separated list of `<name>=<entry URL>`,
 * e.g. `VITE_XO_UI_PLUGINS=xo_kubernetes=http://localhost:4174/remoteEntry.js`.
 *
 * TODO: discover them at runtime from xo-server, so that a plugin can be delivered without rebuilding XO6.
 */
export function getUiPluginManifests(): UiPluginManifest[] {
  const declaration = import.meta.env.VITE_XO_UI_PLUGINS?.trim()

  if (!declaration) {
    return []
  }

  return declaration.split(',').flatMap(item => {
    const separatorIndex = item.indexOf('=')
    const name = item.slice(0, separatorIndex).trim()
    const entry = item.slice(separatorIndex + 1).trim()

    if (separatorIndex === -1 || name === '' || entry === '') {
      console.error(`Invalid UI plugin declaration "${item}", expected "<name>=<entry URL>"`)
      return []
    }

    return [{ name, entry }]
  })
}
