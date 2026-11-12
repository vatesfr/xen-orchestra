import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getV2vTargetName } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

// A pool the pools do not hold yet is named by its id
export function useV2vPoolNameGetter() {
  const { getPoolById } = useXoPoolCollection()

  function getPoolName(poolId: FrontXoPool['id']): string
  function getPoolName(poolId: FrontXoPool['id'] | undefined): string | undefined
  function getPoolName(poolId: FrontXoPool['id'] | undefined) {
    return getV2vTargetName(poolId, id => getPoolById(id)?.name_label)
  }

  return { getPoolName }
}

export function useV2vPoolName(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>): ComputedRef<string>
export function useV2vPoolName(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
): ComputedRef<string | undefined>
export function useV2vPoolName(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { getPoolName } = useV2vPoolNameGetter()

  return computed(() => getPoolName(toValue(rawPoolId)))
}
