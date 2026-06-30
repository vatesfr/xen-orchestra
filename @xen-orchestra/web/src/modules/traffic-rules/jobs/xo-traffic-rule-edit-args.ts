import type { EditTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<EditTrafficRulePayload>({
  identify: payload => payload.oldRule.id,
  toArray: true,
})
