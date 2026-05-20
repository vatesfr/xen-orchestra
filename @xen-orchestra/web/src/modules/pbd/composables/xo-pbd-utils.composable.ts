import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import { useArrayEvery, useArrayFilter, useArraySome } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function getPbdsConnectionStatus(pbds: FrontXoPbd[]) {
  if (pbds.length === 0 || pbds.every(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (pbds.some(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.CONNECTED
}

export function useXoPbdUtils(rawPbds: MaybeRefOrGetter<FrontXoPbd[]>) {
  const pbds = computed(() => toValue(rawPbds))

  const predicate = (pbd: FrontXoPbd) => !pbd.attached

  const disconnectedPbds = useArrayFilter(pbds, predicate)

  const areAllPbdsDisconnected = useArrayEvery(pbds, predicate)

  const areSomePbdsDisconnected = useArraySome(pbds, predicate)

  const allPbdsConnectionStatus = computed(() => getPbdsConnectionStatus(pbds.value))

  return {
    allPbdsConnectionStatus,
    areAllPbdsDisconnected,
    areSomePbdsDisconnected,
    disconnectedPbds,
  }
}
