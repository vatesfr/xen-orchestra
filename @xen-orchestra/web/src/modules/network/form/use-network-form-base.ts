import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
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

  const { name, description, mtu, nbd, useSelect } = useFormBindings(formData)

  function buildBasePayload(): BaseNetworkPayload {
    return {
      poolId: formData.pool!,
      name: formData.name,
      ...(formData.description !== '' && { description: formData.description }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd && { nbd: formData.nbd }),
    }
  }

  return {
    selectedPool,
    buildBasePayload,
    poolSelectBindings: useSelect(poolSelectId),
    nameInputBindings: name,
    descriptionInputBindings: description,
    mtuInputBindings: mtu,
    nbdCheckboxBindings: nbd,
  }
}
