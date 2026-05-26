import { payloadsArg } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import {
  TRAFFIC_RULE_PROTOCOLS_WITH_PORT,
  type TrafficRuleDirection,
  type TrafficRuleProtocol,
  type TrafficRuleTargetType,
  type XoNetwork,
  type XoTask,
  type XoVif,
} from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewTrafficRulePayload = {
  targetType: TrafficRuleTargetType
  targetId: XoNetwork['id'] | XoVif['id']
  allow: boolean
  direction: TrafficRuleDirection
  protocol: TrafficRuleProtocol
  ipRange: string
  port?: number
}

export const useXoTrafficRuleCreateJob = defineJob('traffic-rule.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<void>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { targetType, targetId, ...rest } = payload
          const endpoint =
            targetType === 'network'
              ? `plugins/sdn-controller/networks/${targetId}/actions/add_traffic_rule`
              : `plugins/sdn-controller/vifs/${targetId}/actions/add_traffic_rule`

          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(endpoint, rest)

          await monitorTask(taskId)
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (!payload.targetId) {
          throw new JobError(t('job:arg:target-id-required'))
        }
        if (!payload.direction) {
          throw new JobError(t('job:arg:direction-required'))
        }
        if (!payload.protocol) {
          throw new JobError(t('job:arg:protocol-required'))
        }
        if (!payload.ipRange) {
          throw new JobError(t('job:arg:ip-range-required'))
        }
        if (TRAFFIC_RULE_PROTOCOLS_WITH_PORT.includes(payload.protocol) && payload.port === undefined) {
          throw new JobError(t('job:arg:port-required-for-tcp-udp'))
        }
      })
    },
  }
})
