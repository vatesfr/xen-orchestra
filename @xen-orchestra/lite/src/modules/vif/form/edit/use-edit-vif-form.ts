import type { XenApiNetwork, XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkUtils } from '@/modules/network/composables/network-utils.composable.ts'
import {
  type BaseVifFormData,
  buildBaseVifPayload,
  useVifFormBaseValidation,
} from '@/modules/vif/form/use-vif-form-base.ts'
import type { EditVifPayload } from '@/modules/vif/jobs/vif-edit.job.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { objectIcon } from '@core/icons'
import { mergeValidationConfigs, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'

export type EditVifFormData = BaseVifFormData & {
  network: XenApiNetwork['$ref'] | undefined
}

export function useEditVifForm(vif: XenApiVif) {
  const { records: networks } = useNetworkStore().subscribe()

  const { getNetworkStatus } = useNetworkUtils()

  const { kbps } = vif.qos_algorithm_params
  const txChecksumming = vif.other_config['ethtool-tx']

  const formData = reactive<EditVifFormData>({
    network: vif.network,
    mac: vif.MAC,
    rateLimit: vif.qos_algorithm_type === 'ratelimit' && kbps !== undefined ? Number(kbps) : undefined,
    allowedIps: [...vif.ipv4_allowed, ...vif.ipv6_allowed].join('; '),
    txChecksumming: txChecksumming !== 'false' && txChecksumming !== 'off',
  })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs<BaseVifFormData, EditVifFormData>(useVifFormBaseValidation(), {
      errors: {
        onSubmit: () => ({
          network: { required },
          mac: { required },
        }),
      },
    })
  )

  const { id: networkSelectId } = useFormSelect('network', networks, {
    searchable: true,
    required: true,
    option: {
      id: '$ref',
      label: 'name_label',
      value: '$ref',
      properties: network => ({ icon: objectIcon('network', getNetworkStatus(network)) }),
    },
  })

  async function validateAndBuildPayload(): Promise<EditVifPayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.network === undefined) {
      return undefined
    }

    return {
      network: formData.network,
      ...buildBaseVifPayload(formData),
    }
  }

  return {
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings: useField('mac', () => ({ required: true })),
    rateLimitInputBindings: useField('rateLimit'),
    allowedIpsTextareaBindings: useField('allowedIps'),
    txChecksummingCheckboxBindings: useField('txChecksumming'),
    validateAndBuildPayload,
  }
}
