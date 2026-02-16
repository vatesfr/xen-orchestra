import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import { useArrayEvery, useArrayFilter, useArraySome } from '@vueuse/shared'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useXoPbdUtils(rawPbds: MaybeRefOrGetter<FrontXoPbd[]>) {
  const pbds = computed(() => toValue(rawPbds))

  const predicate = (pbd: FrontXoPbd) => !pbd.attached

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
