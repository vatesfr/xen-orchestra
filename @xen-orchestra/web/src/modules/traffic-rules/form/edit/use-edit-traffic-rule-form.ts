import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { TargetOption } from '@/modules/traffic-rules/form/target-option.util.ts'
import {
  networkToTargetOption,
  vifToTargetOption,
  vmToTargetOption,
} from '@/modules/traffic-rules/form/target-option.util.ts'
import {
  type BaseTrafficRuleFormData,
  useTrafficRuleFormBase,
} from '@/modules/traffic-rules/form/use-traffic-rule-form-base.ts'
import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRule, TrafficRuleTargetType } from '@vates/types'
import { computed, type MaybeRefOrGetter, reactive, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

export type EditTrafficRuleFormData = BaseTrafficRuleFormData & {
  targetType: TrafficRuleTargetType
  targetId: FrontXoNetwork['id'] | FrontXoVif['id'] | undefined
  vmId: FrontXoVm['id'] | undefined
}

export function useEditTrafficRuleForm(rawRule: MaybeRefOrGetter<TrafficRule>) {
  const { t } = useI18n()

  const rule = toComputed(rawRule)

  const { useGetNetworkById } = useXoNetworkCollection()
  const { useGetVifById } = useXoVifCollection()
  const { useGetVmById } = useXoVmCollection()

  const isVifTarget = computed(() => rule.value.type === 'VIF')

  const ruleNetwork = useGetNetworkById(() => (rule.value.type === 'network' ? rule.value.sourceId : undefined))
  const ruleVif = useGetVifById(() => (rule.value.type === 'VIF' ? rule.value.sourceId : undefined))
  const ruleVm = useGetVmById(() => ruleVif.value?.$VM)

  const formData = reactive<EditTrafficRuleFormData>({
    allow: rule.value.allow,
    direction: rule.value.direction,
    protocol: rule.value.protocol,
    port: rule.value.port !== undefined ? Number(rule.value.port) : undefined,
    ipRange: rule.value.ipRange,
    targetType: rule.value.type,
    targetId: rule.value.sourceId,
    vmId: undefined,
  })

  watchEffect(() => {
    if (ruleVif.value && !formData.vmId) {
      formData.vmId = ruleVif.value.$VM
    }
  })

  const targetTypeOptions = [
    { id: 'network', label: t('network'), value: 'network' },
    { id: 'VIF', label: t('vif'), value: 'VIF' },
  ]

  const vmOptions = computed(() => {
    if (ruleVm.value) {
      const hasVifs = ruleVm.value.VIFs.length > 0
      return [vmToTargetOption(ruleVm.value, hasVifs)]
    }

    const missingVmId = ruleVif.value?.$VM
    if (missingVmId) {
      return [
        {
          id: missingVmId,
          label: t('unknown'),
          value: missingVmId,
          icon: objectIcon('vm', 'unknown'),
        },
      ]
    }
    return []
  })

  const targetOptions = computed<TargetOption[]>(() => {
    if (rule.value.type === 'VIF') {
      return ruleVif.value ? [vifToTargetOption(ruleVif.value, `${t('vif')}${ruleVif.value.device}`)] : []
    }
    return ruleNetwork.value ? [networkToTargetOption(ruleNetwork.value)] : []
  })

  const {
    validate,
    useFormSelect,
    useSelect,
    hasPort,
    allowSelectBindings,
    directionSelectBindings,
    protocolSelectBindings,
    portInputBindings,
    ipRangeInputBindings,
    buildBaseRulePayload,
  } = useTrafficRuleFormBase(formData)

  const { id: targetTypeSelectId } = useFormSelect('targetType', targetTypeOptions, {
    required: true,
    disabled: () => true,
    option: { label: 'label', value: 'value' },
  })

  const { id: vmSelectId } = useFormSelect('vmId', vmOptions, {
    required: () => isVifTarget.value,
    disabled: () => true,
    option: { label: 'label', value: 'value', properties: source => ({ icon: source.icon }) },
  })

  const { id: targetSelectId } = useFormSelect('targetId', targetOptions, {
    required: true,
    disabled: () => true,
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({ icon: source.icon }),
    },
  })

  async function validateAndBuildPayload(): Promise<TrafficRulePayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      ...buildBaseRulePayload(),
      targetType: rule.value.type,
      targetId: rule.value.sourceId,
    }
  }

  return {
    isVifTarget,
    hasPort,
    allowSelectBindings,
    directionSelectBindings,
    protocolSelectBindings,
    portInputBindings,
    ipRangeInputBindings,
    targetTypeSelectBindings: useSelect(targetTypeSelectId, () => ({ label: t('object') })),
    vmSelectBindings: useSelect(vmSelectId, () => ({ label: t('from-vm') })),
    targetSelectBindings: useSelect(targetSelectId, () => ({
      label: formData.targetType === 'network' ? t('network') : t('vif'),
    })),
    validateAndBuildPayload,
  }
}
