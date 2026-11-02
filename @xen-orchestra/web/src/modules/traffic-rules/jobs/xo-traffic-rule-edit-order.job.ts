import { xoNetworkArg } from '@/modules/network/jobs/xo-network-args.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { xoTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-args.ts'
import { orderedTrafficRulesArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-order-args.ts'
import { getTrafficRulePriority, isNetworkRuleSupported } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const MIN_TRAFFIC_RULE_PRIORITY = 0

const MAX_TRAFFIC_RULE_PRIORITY = 65535

const MIN_RULES_TO_EDIT_ORDER = 2

type TrafficRulePriorityUpdate = {
  rule: TrafficRule
  priority: number
}

function getKeptRuleIndexes(orderedRules: TrafficRule[]): number[] {
  const chainLengths: number[] = []
  const previousIndexes: (number | undefined)[] = []
  let lastIndex: number | undefined

  orderedRules.forEach((rule, index) => {
    chainLengths[index] = 0
    previousIndexes[index] = undefined

    if (rule.priority === undefined) {
      return
    }

    chainLengths[index] = 1

    for (let previousIndex = 0; previousIndex < index; previousIndex++) {
      const previousRule = orderedRules[previousIndex]

      if (
        previousRule.priority !== undefined &&
        previousRule.priority > rule.priority &&
        chainLengths[previousIndex] + 1 > chainLengths[index]
      ) {
        chainLengths[index] = chainLengths[previousIndex] + 1
        previousIndexes[index] = previousIndex
      }
    }

    if (lastIndex === undefined || chainLengths[index] > chainLengths[lastIndex]) {
      lastIndex = index
    }
  })

  const keptIndexes: number[] = []
  let index = lastIndex

  while (index !== undefined) {
    keptIndexes.unshift(index)
    index = previousIndexes[index]
  }

  return keptIndexes
}

// The other rules get a priority between those of their kept neighbours, spread out to leave room for later moves.
// No new priority is one a rule of the network already has, so the updates never conflict with the other rules.
function getPriorityUpdates(
  orderedRules: TrafficRule[],
  keptIndexes: number[],
  takenPriorities: Set<number | undefined>
): TrafficRulePriorityUpdate[] | undefined {
  const boundIndexes = [-1, ...keptIndexes, orderedRules.length]
  const updates: TrafficRulePriorityUpdate[] = []

  for (let boundIndex = 0; boundIndex < boundIndexes.length - 1; boundIndex++) {
    const upperIndex = boundIndexes[boundIndex]
    const lowerIndex = boundIndexes[boundIndex + 1]
    const movedRules = orderedRules.slice(upperIndex + 1, lowerIndex)

    if (movedRules.length === 0) {
      continue
    }

    let upperPriority = MAX_TRAFFIC_RULE_PRIORITY + 1

    if (upperIndex !== -1) {
      upperPriority = getTrafficRulePriority(orderedRules[upperIndex])
    }

    let lowerPriority = MIN_TRAFFIC_RULE_PRIORITY - 1

    if (lowerIndex !== orderedRules.length) {
      lowerPriority = getTrafficRulePriority(orderedRules[lowerIndex])
    }

    const freePriorities: number[] = []

    for (let priority = upperPriority - 1; priority > lowerPriority; priority--) {
      if (!takenPriorities.has(priority)) {
        freePriorities.push(priority)
      }
    }

    if (freePriorities.length <= movedRules.length) {
      return undefined
    }

    const step = freePriorities.length / (movedRules.length + 1)

    movedRules.forEach((rule, index) => {
      updates.push({ rule, priority: freePriorities[Math.floor((index + 1) * step)] })
    })
  }

  return updates
}

function getOrderUpdates(
  orderedRules: TrafficRule[],
  networkRules: TrafficRule[]
): TrafficRulePriorityUpdate[] | undefined {
  const takenPriorities = new Set(networkRules.map(rule => rule.priority))

  const updates = getPriorityUpdates(orderedRules, getKeptRuleIndexes(orderedRules), takenPriorities)

  if (updates !== undefined) {
    return updates
  }

  return getPriorityUpdates(orderedRules, [], takenPriorities)
}

export const useXoTrafficRuleEditOrderJob = defineJob(
  'traffic-rule.edit-order',
  [xoTrafficRulesArg, orderedTrafficRulesArg, xoNetworkArg],
  () => {
    const { monitorTask } = useXoTaskUtils()
    const { t } = useI18n()
    const { getPoolById } = useXoPoolCollection()

    return {
      async run(networkRules: TrafficRule[], orderedRules: TrafficRule[]) {
        const updates = getOrderUpdates(orderedRules, networkRules)

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

      validate(isRunning, networkRules, orderedRules, network: FrontXoNetwork | undefined) {
        if (network === undefined) {
          throw new JobError(t('job:arg:network-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        if (networkRules.length < MIN_RULES_TO_EDIT_ORDER) {
          throw new JobError(t('job:traffic-rule-edit-order:not-enough-rules'))
        }

        const pool = getPoolById(network.$pool)

        if (!isNetworkRuleSupported(pool)) {
          throw new JobError(t('traffic-rules:xapi-plugin-required'))
        }
      },
    }
  }
)
