import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { payloadsArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule, XoTask } from '@vates/types'
import { omit } from 'lodash-es'
import { useI18n } from 'vue-i18n'

export type EditTrafficRulePayload = {
  oldRule: TrafficRule
  newRule: NewTrafficRulePayload
}

export const useXoTrafficRuleEditJob = defineJob('traffic-rule.edit', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<void>[]> {
      return Promise.allSettled(
        payloads.map(async ({ oldRule, newRule }) => {
          const scope = oldRule.type === 'network' ? 'networks' : 'vifs'
          const endpoint = `plugins/sdn-controller/${scope}/${oldRule.sourceId}/actions/update_traffic_rule`

          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(endpoint, {
            oldRule: {
              allow: oldRule.allow,
              direction: oldRule.direction,
              ipRange: oldRule.ipRange,
              protocol: oldRule.protocol,
              port: oldRule.port !== undefined ? Number(oldRule.port) : undefined,
            },
            newRule: omit(newRule, ['targetType', 'targetId']),
          })

          await monitorTask(taskId)
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
