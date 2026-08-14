import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { logicAnd } from '@vueuse/math'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useHostSrs(hostId: MaybeRefOrGetter<FrontXoHost['id']>) {
  const { hasSrFetchError, getSrById, areSrsReady } = useXoSrCollection()
  const { pbdsByHost, arePbdsReady } = useXoPbdCollection()

  const isReady = logicAnd(areSrsReady, arePbdsReady)

  const hostPbds = computed(() => pbdsByHost.value.get(toValue(hostId)) ?? [])

  const srs = computed(() =>
    hostPbds.value
      .map(pbd => getSrById(pbd.SR))
      .filter((sr): sr is FrontXoSr => sr !== undefined)
      .sort(sortByNameLabel)
  )

  return { srs, hostPbds, isReady, hasSrFetchError, getSrById }
}
