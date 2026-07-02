import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import {
  type BaseVifFormData,
  buildBaseVifPayload,
  useVifFormBaseValidation,
} from '@/modules/vif/form/use-vif-form-base.ts'
import type { NewVifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { mergeValidationConfigs, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, reactive, watch } from 'vue'

export type NewVifFormData = BaseVifFormData & {
  network: FrontXoNetwork['id'] | undefined
}

export function useNewVifForm(
  rawVmId: MaybeRefOrGetter<FrontXoVm['id']>,
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>
) {
  const vmId = toComputed(rawVmId)
  const poolId = toComputed(rawPoolId)

  const { networks } = useXoNetworkCollection()

  const poolNetworks = useArrayFilter(networks, network => network.$pool === poolId.value)

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

  const { id: networkSelectId } = useFormSelect('network', poolNetworks, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(poolId, () => {
    formData.network = undefined
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
