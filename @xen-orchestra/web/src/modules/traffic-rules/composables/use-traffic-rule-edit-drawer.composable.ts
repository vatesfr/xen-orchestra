import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import { type MaybeRefOrGetter } from 'vue'

export function useTrafficRulesEditDrawer(rawTrafficRule: MaybeRefOrGetter<TrafficRule>) {
  const trafficRule = toComputed(rawTrafficRule)

  // const { run, isRunning } = useTrafficRuleEditJob(trafficRule)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/traffic-rules/components/drawer/TrafficRulesEditDrawer.vue'),
    props: {
      rule: trafficRule.value,
    },
    onConfirm: async () => {
      // try {
      //   await run()
      // } catch (error) {
      //   console.error('Error when updating traffic rule:', error)
      // }
    },
  }))

  return { openDrawer }
}
