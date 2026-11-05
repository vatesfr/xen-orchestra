import type { XenApiPbd } from '@/libs/xen-api/xen-api.types.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useArrayEvery, useArrayFilter, useArraySome } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter } from 'vue'

export function usePbdUtils(rawPbds: MaybeRefOrGetter<XenApiPbd[]>) {
  const pbds = toComputed(rawPbds)

  const predicate = (pbd: XenApiPbd) => !pbd.currently_attached

  const disconnectedPbds = useArrayFilter(pbds, predicate)

  const areAllPbdsDisconnected = useArrayEvery(pbds, predicate)

  const areSomePbdsDisconnected = useArraySome(pbds, predicate)

  const allPbdsConnectionStatus = computed(() => {
    if (areAllPbdsDisconnected.value) {
      return CONNECTION_STATUS.DISCONNECTED
    }

    if (areSomePbdsDisconnected.value) {
      return CONNECTION_STATUS.PARTIALLY_CONNECTED
    }

    return CONNECTION_STATUS.CONNECTED
  })

  return {
    allPbdsConnectionStatus,
    areAllPbdsDisconnected,
    areSomePbdsDisconnected,
    disconnectedPbds,
  }
}
