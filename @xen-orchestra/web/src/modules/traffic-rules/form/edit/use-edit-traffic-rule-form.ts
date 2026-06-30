import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import {
  type BaseTrafficRuleFormData,
  useTrafficRuleFormBase,
} from '@/modules/traffic-rules/form/use-traffic-rule-form-base.ts'
import type { EditTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule, TrafficRuleDirection, TrafficRuleProtocol, TrafficRuleTargetType } from '@vates/types'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type EditTrafficRuleFormData = BaseTrafficRuleFormData & {
  targetType: TrafficRuleTargetType

  targetId: FrontXoNetwork['id'] | FrontXoVif['id'] | undefined
}

export function useEditTrafficRuleForm(rawRule: MaybeRefOrGetter<TrafficRule>) {
  const { t } = useI18n()

  const rule = toComputed(rawRule)

  const formData = reactive<EditTrafficRuleFormData>({
    allow: rule.allow,
    direction: rule.direction as TrafficRuleDirection,
    protocol: rule.protocol as TrafficRuleProtocol,
    port: rule.port !== undefined ? Number(rule.port) : undefined,
    ipRange: rule.ipRange,
    targetType: rule.value.type,
    targetId: rule.value.sourceId,
  })

  const {
    validate,
    hasPort,
    allowSelectBindings,
    directionSelectBindings,
    protocolSelectBindings,
    portInputBindings,
    ipRangeInputBindings,
    buildBaseRulePayload,
  } = useTrafficRuleFormBase(formData)

  async function validateAndBuildPayload(): Promise<EditTrafficRulePayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      oldRule: rule.value,
      newRule: {
        ...buildBaseRulePayload(),
        targetType: rule.value.type,
        targetId: rule.value.sourceId,
      },
    }
  }

  return {
    rule,
    hasPort,
    allowSelectBindings,
    directionSelectBindings,
    protocolSelectBindings,
    portInputBindings,
    ipRangeInputBindings,
    validateAndBuildPayload,
  }
}
