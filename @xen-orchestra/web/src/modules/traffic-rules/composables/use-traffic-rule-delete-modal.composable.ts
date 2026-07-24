import { useXoTrafficRuleDeleteJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-delete.job.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useTrafficRuleDeleteModal(rawRules: MaybeRefOrGetter<TrafficRule[]>) {
  const rules = toComputed(rawRules)

  const { t } = useI18n()

  const { run, canRun, isRunning, errorMessage } = useXoTrafficRuleDeleteJob(rules)

  const { open } = useDeleteModal()

  function openModal() {
    const count = rules.value.length

    return open({
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (error) {
            console.error('Error when deleting traffic rule:', error)
          }
        },
      },
      props: {
        subject: t('n-traffic-rules', { n: count }),
        description: t('traffic-rule-delete-warning'),
        confirmLabel: t('action:delete-n-traffic-rules', { n: count }),
      },
    })
  }

  return { openModal, canRun, isRunning, errorMessage }
}
