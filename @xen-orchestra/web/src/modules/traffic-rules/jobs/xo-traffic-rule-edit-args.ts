import type { BaseTrafficRulePayload } from '@/modules/traffic-rules/form/use-traffic-rule-form-base.ts'
import { defineJobArg } from '@core/packages/job'

export const editTrafficRulePayloadArg = defineJobArg<BaseTrafficRulePayload>({
  identify: false,
  toArray: false,
})
