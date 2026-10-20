import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// A reload or a shared link may name a pool this XO does not know (removed, other XO). Until the pools are loaded the
// pool is trusted, so that a known one does not flash as unknown
export function useV2vIsUnknownPool(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { arePoolsReady, hasPoolById } = useXoPoolCollection()

  return computed(() => {
    const poolId = toValue(rawPoolId)

    return arePoolsReady.value && poolId !== undefined && !hasPoolById(poolId)
  })
}
