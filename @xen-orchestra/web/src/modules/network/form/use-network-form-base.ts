import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { BOND_MODE } from '@vates/types'
import { type MaybeRefOrGetter, toRef, watch } from 'vue'

export const BOND_MODES: BOND_MODE[] = ['balance-slb', 'active-backup', 'lacp']

export type BaseNetworkFormData = {
  pool: FrontXoPool['id'] | undefined
  name: string
  description: string
  mtu: number | undefined
  nbd: boolean
}

export type BaseNetworkPayload = {
  poolId: FrontXoPool['id']
  name: string
  description?: string
  mtu?: number
  nbd?: boolean
}

export function useNetworkFormBase<T extends BaseNetworkFormData>(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  formData: T
) {
  const poolId = toComputed(_poolId)
  const { pools, useGetPoolById } = useXoPoolCollection()

  const { id: poolSelectId } = useFormSelect(pools, {
    searchable: true,
    required: true,
    model: toRef(formData, 'pool'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(
    pools,
    newPools => {
      const targetPool = newPools.find(pool => pool.id === poolId.value)

      if (targetPool?.id !== formData.pool) {
        formData.pool = targetPool?.id
      }
    },
    { immediate: true }
  )

  const selectedPool = useGetPoolById(toRef(formData, 'pool'))

  function buildBasePayload(): BaseNetworkPayload {
    return {
      poolId: formData.pool!,
      name: formData.name.trim(),
      ...(formData.description.trim() !== '' && { description: formData.description.trim() }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd && { nbd: formData.nbd }),
    }
  }

  return {
    poolSelectId,
    selectedPool,
    buildBasePayload,
  }
}
