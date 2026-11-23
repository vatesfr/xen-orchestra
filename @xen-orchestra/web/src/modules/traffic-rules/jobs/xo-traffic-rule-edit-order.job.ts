import { xoNetworkArg } from '@/modules/network/jobs/xo-network-args.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { xoTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-args.ts'
import { orderedTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-order-args.ts'
import {
  getTrafficRulePriorityUpdates,
  isNetworkRuleSupported,
} from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const MIN_RULES_TO_EDIT_ORDER = 2

export const useXoTrafficRuleEditOrderJob = defineJob(
  'traffic-rule.edit-order',
  [xoTrafficRulesArg, orderedTrafficRulesArg, xoNetworkArg],
  () => {
    const { monitorTask } = useXoTaskUtils()
    const { t } = useI18n()
    const { getPoolById } = useXoPoolCollection()

    return {
      async run(networkRules: TrafficRule[], orderedRules: TrafficRule[]) {
        const updates = getTrafficRulePriorityUpdates(orderedRules, networkRules)

        if (updates === undefined) {
          throw new JobError(t('job:traffic-rule-edit-order:no-free-priority'))
        }

        for (const { rule, priority } of updates) {
          const scope = rule.type === 'network' ? 'networks' : 'vifs'
          const endpoint = `plugins/sdn-controller/${scope}/${rule.sourceId}/actions/update_traffic_rule`

          const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(endpoint, {
            oldRule: {
              allow: rule.allow,
              direction: rule.direction,
              ipRange: rule.ipRange,
              protocol: rule.protocol,
              port: rule.port !== undefined ? Number(rule.port) : undefined,
              priority: rule.priority,
            },
            newRule: { priority },
          })

          await monitorTask(taskId)
        }
      },

      validate(isRunning, networkRules, _orderedRules, network: FrontXoNetwork | undefined) {
        if (network === undefined) {
          throw new JobError(t('job:arg:network-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        if (networkRules.length < MIN_RULES_TO_EDIT_ORDER) {
          throw new JobError(t('job:traffic-rule-edit-order:not-enough-rules', { n: MIN_RULES_TO_EDIT_ORDER }))
        }

        const pool = getPoolById(network.$pool)

        if (!isNetworkRuleSupported(pool)) {
          throw new JobError(t('traffic-rules:xapi-plugin-required'))
        }
      },
    }
  }
)
