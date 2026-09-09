import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<TrafficRulePayload>({
  identify: payload => payload.targetId,
  toArray: true,
})
