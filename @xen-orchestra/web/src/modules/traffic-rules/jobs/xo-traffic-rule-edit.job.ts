import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { BaseTrafficRulePayload } from '@/modules/traffic-rules/form/use-traffic-rule-form-base.ts'
import { xoTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-args.ts'
import { editTrafficRulePayloadArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoTrafficRuleEditJob = defineJob(
  'traffic-rule.edit',
  [xoTrafficRulesArg, editTrafficRulePayloadArg],
  () => {
    const { monitorTask } = useXoTaskUtils()
    const { t } = useI18n()

    return {
      async run(oldRules: TrafficRule[], newRule: BaseTrafficRulePayload): Promise<PromiseSettledResult<void>[]> {
        const results = await Promise.allSettled(
          oldRules.map(async oldRule => {
            const scope = oldRule.type === 'network' ? 'networks' : 'vifs'
            const endpoint = `plugins/sdn-controller/${scope}/${oldRule.sourceId}/actions/update_traffic_rule`

            const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(endpoint, {
              oldRule: {
                allow: oldRule.allow,
                direction: oldRule.direction,
                ipRange: oldRule.ipRange,
                protocol: oldRule.protocol,
                port: oldRule.port !== undefined ? Number(oldRule.port) : undefined,
              },
              newRule,
            })

            await monitorTask(taskId)
          })
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to edit traffic rule ${oldRules[index].id}:`, result.reason)
          }
        })
        return results
      },

      validate(isRunning, oldRules) {
        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        if (oldRules.length === 0) {
          throw new JobError(t('job:arg:missing-payload'))
        }
      },
    }
  }
)
