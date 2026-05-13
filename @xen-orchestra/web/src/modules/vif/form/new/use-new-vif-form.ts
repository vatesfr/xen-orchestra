import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type BaseVifFormData, type BaseVifPayload, useVifFormBase } from '@/modules/vif/form/use-vif-form-base.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, reactive, toRef, toValue, watch } from 'vue'

export type NewVifFormData = BaseVifFormData & {
  network: FrontXoNetwork['id'] | undefined
}

export type NewVifPayload = BaseVifPayload & {
  vmId: FrontXoVm['id']
  networkId: FrontXoNetwork['id']
}

export function useNewVifForm(_vmId: MaybeRefOrGetter<FrontXoVm['id']>, _poolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const { networks } = useXoNetworkCollection()

  const poolNetworks = useArrayFilter(networks, network => network.$pool === toValue(_poolId))

  const formData = reactive<NewVifFormData>({
    network: undefined,
    mac: '',
    rateLimit: undefined,
    allowedIps: '',
    txChecksumming: true,
  })

  const {
    useSelect,
    buildBasePayload,
    isMacValid,
    isAllowedIpsValid,
    macInputBindings,
    rateLimitInputBindings,
    allowedIpsTextareaBindings,
    txChecksummingCheckboxBindings,
  } = useVifFormBase(formData)

  const { id: networkSelectId } = useFormSelect(poolNetworks, {
    searchable: true,
    required: true,
    model: toRef(formData, 'network'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(
    () => toValue(_poolId),
    () => {
      formData.network = undefined
    }
  )

  function validateAndBuildPayload(): NewVifPayload | undefined {
    if (formData.network === undefined || !isMacValid.value || !isAllowedIpsValid.value) {
      return undefined
    }

    return {
      vmId: toValue(_vmId),
      networkId: formData.network,
      ...buildBasePayload(),
    }
  }

  return {
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings,
    rateLimitInputBindings,
    allowedIpsTextareaBindings,
    txChecksummingCheckboxBindings,
    validateAndBuildPayload,
  }
}
