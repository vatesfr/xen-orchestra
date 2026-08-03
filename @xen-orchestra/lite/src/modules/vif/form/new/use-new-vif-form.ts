import type { XenApiNetwork, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
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
import { type MaybeRefOrGetter, reactive } from 'vue'

// Pourquoi $ref et pas uuid ici ? uuid = identité permanente (id ?), $ref = handle de session, et Xapi est câblé en $ref, pas en uuid
// uuid pour les url (forcément), partout ailleurs, $ref
export type NewVifFormData = BaseVifFormData & {
  network: XenApiNetwork['$ref'] | undefined
}

export function useNewVifForm(rawVmRef: MaybeRefOrGetter<XenApiVm['$ref']>) {
  const vmRef = toComputed(rawVmRef)

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
      value: '$ref',
    },
  })

  async function validateAndBuildPayload(): Promise<NewVifPayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.network === undefined) {
      return undefined
    }

    return {
      vmRef: vmRef.value,
      network: formData.network,
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
