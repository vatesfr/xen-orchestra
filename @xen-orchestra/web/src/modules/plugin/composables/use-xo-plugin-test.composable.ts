import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginTest(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const testData = ref<unknown>()

  const {
    run,
    canRun: canTestPlugin,
    isRunning: isTestingPlugin,
    errorMessage: testPluginErrorMessage,
  } = useXoPluginTestJob(plugin, testData)

  const { open } = useOverlay({
    component: () => import('@/modules/plugin/components/drawer/PluginTestDrawer.vue'),
    events: {
      onConfirm: async (newTestData: unknown) => {
        testData.value = newTestData

        try {
          await run()
        } catch (error) {
          console.error('Error when testing the plugin', error)

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    plugin: plugin.value,
  }))

  function testPlugin() {
    return open({ props })
  }

  return { testPlugin, canTestPlugin, isTestingPlugin, testPluginErrorMessage }
}
