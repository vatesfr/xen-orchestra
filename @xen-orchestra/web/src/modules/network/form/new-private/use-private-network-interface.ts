import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, toRef, watch } from 'vue'

export type PrivateNetworkInterface = {
  key: string
  pool: FrontXoPool['id'] | undefined
  pif: FrontXoPif['id'] | undefined
}

export function usePrivateNetworkInterface(
  networkInterface: PrivateNetworkInterface,
  _excludedPoolIds: MaybeRefOrGetter<FrontXoPool['id'][]>
) {
  const excludedPoolIds = toComputed(_excludedPoolIds)

  const { pools, useGetPoolById } = useXoPoolCollection()

  const availablePools = useArrayFilter(pools, availablePool => !excludedPoolIds.value.includes(availablePool.id))

  const pool = toRef(networkInterface, 'pool')

  const { id: poolSelectId } = useFormSelect(availablePools, {
    searchable: true,
    required: true,
    model: pool,
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(excludedPoolIds, newExcludedPoolIds => {
    if (pool.value !== undefined && newExcludedPoolIds.includes(pool.value)) {
      pool.value = undefined
    }
  })

  const selectedPool = useGetPoolById(() => pool.value)

  const { interfacesSelectId: pifSelectId } = useNetworkPifSelect(selectedPool, toRef(networkInterface, 'pif'), {
    privateNetwork: true,
    value: 'id',
  })

  return {
    poolSelectId,
    pifSelectId,
  }
}
