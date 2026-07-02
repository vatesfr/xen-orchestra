import {
  type EditTrafficRulePayload,
  useXoTrafficRuleEditJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useTrafficRulesEditDrawer(rawTrafficRule: MaybeRefOrGetter<TrafficRule>) {
  const trafficRule = toComputed(rawTrafficRule)

  const editPayload = ref<EditTrafficRulePayload | undefined>(undefined)

  const { run, isRunning } = useXoTrafficRuleEditJob(() => (editPayload.value ? [editPayload.value] : []))

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/traffic-rules/components/drawer/TrafficRulesEditDrawer.vue'),
    props: {
      rule: trafficRule.value,
    },
    onConfirm: async (payload: EditTrafficRulePayload) => {
      editPayload.value = payload
      try {
        await run()
      } catch (error) {
        console.error('Error when updating traffic rule:', error)
      }
    },
  }))

  return { openDrawer, isRunning }
}
