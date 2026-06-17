import { xoTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule, XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoTrafficRuleDeleteJob = defineJob('traffic-rule.delete', [xoTrafficRulesArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(rules: TrafficRule[]) {
      const results = await Promise.allSettled(
        rules.map(async rule => {
          const endpoint =
            rule.type === 'VIF'
              ? `plugins/sdn-controller/vifs/${rule.sourceId}/actions/delete_traffic_rule`
              : `plugins/sdn-controller/networks/${rule.networkId}/actions/delete_traffic_rule`

          const body: Record<string, unknown> = {
            direction: rule.direction,
            ipRange: rule.ipRange,
            protocol: rule.protocol,
          }

          if (rule.port !== undefined) {
            body.port = rule.port
          }

          if (rule.type === 'VIF') {
            body.vifId = rule.sourceId
          } else {
            body.networkId = rule.networkId
          }

          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(endpoint, body)

          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete traffic rule ${rules[index].id}:`, result.reason)
        }
      })
      return results
    },

    validate: (isRunning, rules: TrafficRule[]) => {
      if (rules.length === 0) {
        throw new JobError(t('job:traffic-rule-delete:missing-rule'))
      }
      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
