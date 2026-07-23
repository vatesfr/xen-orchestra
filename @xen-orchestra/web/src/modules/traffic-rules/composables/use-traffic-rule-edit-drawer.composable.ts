import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { useXoTrafficRuleEditJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useTrafficRuleEditDrawer(rawTrafficRule: MaybeRefOrGetter<TrafficRule>) {
  const trafficRule = toComputed(rawTrafficRule)

  const newRulePayload = ref<TrafficRulePayload | undefined>(undefined)

  const { run, isRunning, canRun } = useXoTrafficRuleEditJob(() => [trafficRule.value], newRulePayload)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/traffic-rules/components/drawer/TrafficRuleEditDrawer.vue'),
    props: {
      rule: trafficRule.value,
    },
    onConfirm: async (payload: TrafficRulePayload) => {
      newRulePayload.value = payload
      try {
        await run()
      } catch (error) {
        console.error('Error when updating traffic rule:', error)
      }
    },
  }))

  return { openDrawer, isRunning, canRun }
}
