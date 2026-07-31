import {
  type BaseVifFormData,
  buildBaseVifPayload,
  useVifFormBaseValidation,
} from '@/modules/vif/form/use-vif-form-base.ts'
import type { NewVifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { mergeValidationConfigs, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XenApiNetwork, XenApiVm } from '@vates/types'
import { type MaybeRefOrGetter, reactive } from 'vue'

export type NewVifFormData = BaseVifFormData & {
  network: XenApiNetwork['uuid'] | undefined
}

export function useNewVifForm(rawVmId: MaybeRefOrGetter<XenApiVm['uuid']>) {
  const vmId = toComputed(rawVmId)

  const { records: networks } = useNetworkStore().subscribe()

  const formData = reactive<NewVifFormData>({
    network: undefined,
    mac: '',
    rateLimit: undefined,
    allowedIps: '',
    txChecksumming: true,
  })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs<BaseVifFormData, NewVifFormData>(useVifFormBaseValidation(), {
      errors: {
        onSubmit: () => ({
          network: { required },
        }),
      },
    })
  )

  const { id: networkSelectId } = useFormSelect('network', networks, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'uuid',
    },
  })

  async function validateAndBuildPayload(): Promise<NewVifPayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.network === undefined) {
      return undefined
    }

    return {
      vmId: vmId.value,
      networkId: formData.network,
      ...buildBaseVifPayload(formData),
    }
  }

  return {
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings: useField('mac'),
    rateLimitInputBindings: useField('rateLimit'),
    allowedIpsTextareaBindings: useField('allowedIps'),
    txChecksummingCheckboxBindings: useField('txChecksumming'),
    validateAndBuildPayload,
  }
}
