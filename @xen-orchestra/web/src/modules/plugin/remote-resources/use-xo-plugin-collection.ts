import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPlugin } from '@vates/types'
import { useSorted } from '@vueuse/core'

export type FrontXoPlugin = Omit<
  Pick<XoPlugin, (typeof pluginFields)[number]>,
  'configurationSchema' | 'testSchema'
> & {
  configurationSchema?: JsonSchema
  testSchema?: JsonSchema
}

const pluginFields = [
  'id',
  'name',
  'version',
  'description',
  'keywords',
  'loaded',
  'autoload',
  'unloadable',
  'configuration',
  'configurationSchema',
  'configurationPresets',
  'configured',
  'testable',
  'testSchema',
] as const satisfies readonly (keyof XoPlugin)[]

export const useXoPluginCollection = defineRemoteResource({
  url: `${BASE_URL}/plugins?fields=${pluginFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'plugin', fields: pluginFields }),
  initialData: () => [] as FrontXoPlugin[],
  state: (rawPlugins, context) => {
    const plugins = useSorted(rawPlugins, (plugin1, plugin2) => plugin1.name.localeCompare(plugin2.name))

    return useXoCollectionState(plugins, {
      context,
      baseName: 'plugin',
    })
  },
})
