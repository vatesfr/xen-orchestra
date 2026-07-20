import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
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
import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type FormValidationConfig, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRuleTargetType } from '@vates/types'
import { computed, type MaybeRefOrGetter, reactive, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewTrafficRuleFormData = BaseTrafficRuleFormData & {
  targetType: TrafficRuleTargetType
  vmId: FrontXoVm['id'] | undefined
  targetId: FrontXoNetwork['id'] | FrontXoVif['id'] | undefined
}

export function useNewTrafficRuleForm(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  rawVifId: MaybeRefOrGetter<FrontXoVif['id'] | undefined>
) {
  const { t } = useI18n()

  const poolId = toComputed(rawPoolId)
  const vifId = toComputed(rawVifId)

  const formData = reactive<NewTrafficRuleFormData>({
    allow: true,
    direction: 'from',
    protocol: 'TCP',
    port: undefined,
    ipRange: '',
    targetType: vifId.value ? 'VIF' : 'network',
    vmId: undefined,
    targetId: undefined,
  })

  const isVifTarget = computed(() => formData.targetType === 'VIF')

  const { networks, getNetworkById } = useXoNetworkCollection()
  const { vifs, useGetVifById } = useXoVifCollection()
  const { vmsByPool } = useXoVmCollection()

  const sourceVif = useGetVifById(() => vifId.value)

  const isParentNetworkPlugged = computed(() => {
    const vif = sourceVif.value

    if (!vif) {
      return true
    }

    const parentNetwork = getNetworkById(vif.$network)

    return parentNetwork ? parentNetwork.PIFs.length > 0 : false
  })

  const poolNetworks = computed(() =>
    networks.value.filter(network => network.$pool === poolId.value && network.PIFs.length > 0)
  )

  const poolVms = computed(() => (poolId.value ? (vmsByPool.value.get(poolId.value) ?? []) : []))

  const vmVifs = computed(() =>
    vifs.value.filter(vif => vif.$VM === formData.vmId).sort((vifA, vifB) => Number(vifA.device) - Number(vifB.device))
  )

  const targetOptions = computed<TargetOption[]>(() =>
    isVifTarget.value
      ? vmVifs.value.map(vif => vifToTargetOption(vif, `${t('vif')}${vif.device}`))
      : poolNetworks.value.map(network => networkToTargetOption(network))
  )

  const vmOptions = computed(() => poolVms.value.map(vm => {
    const hasVifs = vm.VIFs.length > 0

    return vmToTargetOption(vm, hasVifs)
  }))

  const targetTypeOptions = [
    { id: 'network', label: t('network'), value: 'network' },
    { id: 'VIF', label: t('vif'), value: 'VIF' },
  ]

  const extraConfig: FormValidationConfig<NewTrafficRuleFormData> = {
    errors: {
      onSubmit: () => ({
        targetId: {
          required: withMessage(required, () => (isVifTarget.value ? t('vif-required') : t('network-required'))),
        },
        vmId: {
          requiredIf: withMessage(requiredIf(isVifTarget), () => t('vm-required')),
        },
      }),
    },
  }

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
  } = useTrafficRuleFormBase(formData, extraConfig)

  const { id: targetTypeSelectId } = useFormSelect('targetType', targetTypeOptions, {
    required: true,
    disabled: () => !isParentNetworkPlugged.value,
    option: { label: 'label', value: 'value' },
  })

  const { id: vmSelectId } = useFormSelect('vmId', vmOptions, {
    required: () => isVifTarget.value,
    searchable: true,
    disabled: () => sourceVif.value !== undefined,
    option: {
      label: 'label',
      value: 'value',
      disabled: source => source.disabled,
      properties: source => ({ icon: source.icon }),
    },
  })

  const { id: targetSelectId } = useFormSelect('targetId', targetOptions, {
    required: true,
    searchable: true,
    disabled: () => sourceVif.value !== undefined || (formData.targetType === 'VIF' && formData.vmId === undefined),
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({ icon: source.icon }),
    },
  })

  watch(
    () => formData.targetType,
    () => {
      formData.vmId = undefined
      formData.targetId = undefined
    }
  )

  watch(
    () => formData.vmId,
    () => {
      formData.targetId = undefined
    }
  )

  watchEffect(() => {
    if (!sourceVif.value) {
      return
    }

    if (formData.targetType === 'VIF') {
      if (!formData.vmId) {
        formData.vmId = sourceVif.value.$VM
      }

      if (!formData.targetId) {
        formData.targetId = sourceVif.value.id
      }
    } else if (formData.targetType === 'network') {
      if (!formData.targetId) {
        formData.targetId = sourceVif.value.$network
      }
    }
  })

  async function validateAndBuildPayload(): Promise<NewTrafficRulePayload | undefined> {
    const valid = await validate()

    if (!valid || formData.targetId === undefined) {
      return undefined
    }

    return {
      ...buildBaseRulePayload(),
      targetType: formData.targetType,
      targetId: formData.targetId,
    }
  }

  return {
    isVifTarget,
    hasPort,
    allowSelectBindings,
    protocolSelectBindings,
    portInputBindings,
    directionSelectBindings,
    ipRangeInputBindings,
    targetTypeSelectBindings: useSelect(targetTypeSelectId, () => ({ label: t('object') })),
    vmSelectBindings: useSelect(vmSelectId, () => ({ label: t('from-vm') })),
    targetSelectBindings: useSelect(targetSelectId, () => ({
      label: formData.targetType === 'network' ? t('choose-network') : t('choose-vif'),
    })),
    validateAndBuildPayload,
  }
}
