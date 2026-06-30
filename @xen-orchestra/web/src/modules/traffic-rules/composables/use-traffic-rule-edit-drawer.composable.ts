import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import { type MaybeRefOrGetter } from 'vue'

export function useTrafficRulesUpdateDrawer(rawTrafficRule: MaybeRefOrGetter<TrafficRule>) {
  const trafficRule = toComputed(rawTrafficRule)

  // const { run, isRunning } = useXoTrafficRuleUpdateJob(trafficRule)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/traffic-rules/components/drawer/TrafficRulesUpdateDrawer.vue'),
    onConfirm: async () => {
      console.log(trafficRule)
      // try {
      //   await run()
      // } catch (error) {
      //   console.error('Error when updating traffic rule:', error)
      // }
    },
  }))

  return { openDrawer }
}
