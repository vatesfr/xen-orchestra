import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { useArrayFilter } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useXoPbdUtils(rawPbds: MaybeRefOrGetter<FrontXoPbd[]>) {
  const pbds = computed(() => toValue(rawPbds))

  const predicate = (pbd: FrontXoPbd) => !pbd.attached

  const disconnectedPbds = useArrayFilter(pbds, predicate)

  const allPbdsConnectionStatus = computed(() => getPbdsConnectionStatus(pbds.value))

  return {
    allPbdsConnectionStatus,
    disconnectedPbds,
  }
}
