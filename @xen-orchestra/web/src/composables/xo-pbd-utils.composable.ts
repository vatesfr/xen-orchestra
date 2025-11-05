import type { XoPbd } from '@/types/xo/pbd.type.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { useArrayEvery, useArrayFilter, useArraySome } from '@vueuse/shared'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useXoPbdUtils(rawPbds: MaybeRefOrGetter<XoPbd[]>) {
  const pbds = computed(() => toValue(rawPbds))

  const predicate = (pbd: XoPbd) => !pbd.attached

  const disconnectedPbds = useArrayFilter(pbds, predicate)

  const areAllPbdsDisconnected = useArrayEvery(pbds, predicate)

  const areSomePbdsDisconnected = useArraySome(pbds, predicate)

  const allPbdsConnectionStatus = computed<Status>(() => {
    if (areAllPbdsDisconnected.value) {
      return 'disconnected'
    }

    if (areSomePbdsDisconnected.value) {
      return 'partially-connected'
    }

    return 'connected'
  })

  return {
    allPbdsConnectionStatus,
    areAllPbdsDisconnected,
    areSomePbdsDisconnected,
    disconnectedPbds,
  }
}
