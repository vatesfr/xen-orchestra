import type PluginConfigurationDrawer from '@/modules/plugin/components/drawer/PluginConfigurationDrawer.vue'
import type PluginTestDrawer from '@/modules/plugin/components/drawer/PluginTestDrawer.vue'
import type { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type AsyncComponentLoader, type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginDrawerJob(
  rawPlugin: MaybeRefOrGetter<FrontXoPlugin>,
  {
    useJob,
    drawer,
  }: {
    useJob: typeof useXoPluginConfigureJob | typeof useXoPluginTestJob
    drawer: AsyncComponentLoader<typeof PluginConfigurationDrawer | typeof PluginTestDrawer>
  }
) {
  const plugin = toComputed(rawPlugin)

  const payload = ref<unknown>()

  const { run, canRun, isRunning, errorMessage } = useJob(plugin, payload)

  // the error of the last run, shown in the drawer, which stays open
  const runError = ref<Error>()

  const { open } = useOverlay({
    component: drawer,
    events: {
      onConfirm: async (newPayload: unknown) => {
        payload.value = newPayload
        runError.value = undefined

        try {
          await run()
        } catch (error) {
          console.error(`Error when running a job on the plugin ${plugin.value.name}`, error)

          runError.value = error instanceof Error ? error : new Error(String(error))

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    plugin: plugin.value,
    error: runError.value,
  }))

  function openDrawer() {
    runError.value = undefined

    return open({ props })
  }

  return { openDrawer, canRun, isRunning, errorMessage }
}
