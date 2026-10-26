import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginConfigure(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const configuration = ref<unknown>()

  const {
    run,
    canRun: canConfigurePlugin,
    isRunning: isConfiguringPlugin,
    errorMessage: configurePluginErrorMessage,
  } = useXoPluginConfigureJob(plugin, configuration)

  const { open } = useOverlay({
    component: () => import('@/modules/plugin/components/drawer/PluginConfigurationDrawer.vue'),
    events: {
      onConfirm: async (newConfiguration: unknown) => {
        configuration.value = newConfiguration

        try {
          await run()
        } catch (error) {
          console.error('Error when configuring the plugin', error)

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    plugin: plugin.value,
  }))

  function configurePlugin() {
    return open({ props })
  }

  return { configurePlugin, canConfigurePlugin, isConfiguringPlugin, configurePluginErrorMessage }
}
