import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { payloadsArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-args.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type EditTrafficRulePayload = {
  oldRule: TrafficRule
  newRule: NewTrafficRulePayload
}

export const useXoTrafficRuleEditJob = defineJob('traffic-rule.edit', [payloadsArg], () => {
  // const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<void>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          console.log('payload', payload)
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
