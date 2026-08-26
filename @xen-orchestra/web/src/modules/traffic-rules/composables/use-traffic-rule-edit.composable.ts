import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { useXoTrafficRuleEditJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useTrafficRuleEdit(rawTrafficRule: MaybeRefOrGetter<TrafficRule>) {
  const trafficRule = toComputed(rawTrafficRule)

  const newRulePayload = ref<TrafficRulePayload | undefined>(undefined)

  const {
    run,
    canRun: canEditTrafficRule,
    isRunning: isEditingTrafficRule,
    errorMessage: editTrafficRuleErrorMessage,
  } = useXoTrafficRuleEditJob(() => [trafficRule.value], newRulePayload)

  const { open } = useOverlay({
    component: () => import('@/modules/traffic-rules/components/drawer/TrafficRuleEditDrawer.vue'),
    events: {
      onConfirm: async (payload: TrafficRulePayload) => {
        newRulePayload.value = payload

        try {
          await run()
        } catch (error) {
          console.error('Error when updating traffic rule:', error)
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    rule: trafficRule.value,
  }))

  function editTrafficRule() {
    return open({ props })
  }

  return { editTrafficRule, canEditTrafficRule, isEditingTrafficRule, editTrafficRuleErrorMessage }
}
