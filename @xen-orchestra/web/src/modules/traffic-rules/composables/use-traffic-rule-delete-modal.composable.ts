import { useXoTrafficRuleDeleteJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-delete.job.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'

export function useTrafficRuleDeleteModal(rawRules: MaybeRefOrGetter<TrafficRule[]>) {
  const rules = toComputed(rawRules)

  const { run, canRun, isRunning, errorMessage } = useXoTrafficRuleDeleteJob(rules)

  const openModal = useModal(() => ({
    component: import('@/modules/traffic-rules/components/modal/TrafficRuleDeleteModal.vue'),
    props: { count: rules.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting traffic rule:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
