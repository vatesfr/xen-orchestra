import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import {
  type BaseTrafficRuleFormData,
  useTrafficRuleFormBase,
} from '@/modules/traffic-rules/form/use-traffic-rule-form-base.ts'
import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import type { TrafficRuleTargetType } from '@/modules/traffic-rules/types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ObjectIconName } from '@core/icons'
import { type FormValidationConfig, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoNetwork, XoVif } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewTrafficRuleFormData = BaseTrafficRuleFormData & {
  targetType: TrafficRuleTargetType
  vmId: FrontXoVm['id'] | undefined
  targetId: string | undefined
}

type TargetOption = { id: string; label: string; value: string; icon: 'object:network' | 'object:vif' }

export function useNewTrafficRuleForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const poolId = toComputed(_poolId)
  const { t } = useI18n()

  const formData = reactive<NewTrafficRuleFormData>({
    allow: true,
    direction: 'from',
    protocol: 'TCP',
    port: undefined,
    ipRange: '',
    targetType: 'network',
    vmId: undefined,
    targetId: undefined,
  })

  const isVifTarget = computed(() => formData.targetType === 'VIF')

  const { networks } = useXoNetworkCollection()
  const { vifs } = useXoVifCollection()
  const { vmsByPool } = useXoVmCollection()

  const poolNetworks = computed(() =>
    networks.value.filter(network => network.$pool === poolId.value && network.PIFs.length > 0)
  )

  const poolVms = computed(() => (poolId.value ? (vmsByPool.value.get(poolId.value) ?? []) : []))

  const vmVifs = computed(() =>
    vifs.value.filter(vif => vif.$VM === formData.vmId).sort((vifA, vifB) => Number(vifA.device) - Number(vifB.device))
  )

  const targetOptions = computed<TargetOption[]>(() =>
    isVifTarget.value
      ? vmVifs.value.map(vif => ({
          id: vif.id,
          label: `${t('vif')}${vif.device}`,
          value: vif.id,
          icon: 'object:vif',
        }))
      : poolNetworks.value.map(network => ({
          id: network.id,
          label: network.name_label,
          value: network.id,
          icon: 'object:network',
        }))
  )

  const vmOptions = computed(() =>
    poolVms.value.map(vm => {
      const state = toLower(vm.power_state)

      return {
        id: vm.id,
        label: vm.name_label,
        value: vm.id,
        icon: `object:vm:${state === undefined ? 'unknown' : state}` as ObjectIconName,
      }
    })
  )

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
          requiredIf: withMessage(requiredIf(isVifTarget), t('vm-required')),
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
    option: { label: 'label', value: 'value' },
  })

  const { id: vmSelectId } = useFormSelect('vmId', vmOptions, {
    required: true,
    searchable: true,
    option: { label: 'label', value: 'value', properties: source => ({ icon: source.icon }) },
  })

  const { id: targetSelectId } = useFormSelect('targetId', targetOptions, {
    required: true,
    searchable: true,
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

  async function validateAndBuildPayload(): Promise<NewTrafficRulePayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      ...buildBaseRulePayload(),
      targetType: formData.targetType,
      targetId: formData.targetId as XoNetwork['id'] | XoVif['id'],
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
    targetTypeSelectBindings: useSelect(targetTypeSelectId, () => ({ label: t('rule-type') })),
    vmSelectBindings: useSelect(vmSelectId, () => ({ label: t('from-vm') })),
    targetSelectBindings: useSelect(targetSelectId, () => ({
      label: formData.targetType === 'network' ? t('choose-network') : t('choose-vif'),
    })),
    validateAndBuildPayload,
  }
}
