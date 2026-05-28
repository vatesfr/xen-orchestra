import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<NewTrafficRulePayload>({
  identify: payload => payload.targetId,
  toArray: true,
})
