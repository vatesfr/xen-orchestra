import type { XenApiPbd } from '@/libs/xen-api/xen-api.types'
import { useArrayEvery, useArrayFilter, useArraySome } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  PARTIALLY_CONNECTED: 'partially-connected',
  DISCONNECTED: 'disconnected',
} as const

export function usePbdUtils(rawPbds: MaybeRefOrGetter<XenApiPbd[]>) {
  const pbds = computed(() => toValue(rawPbds))

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
