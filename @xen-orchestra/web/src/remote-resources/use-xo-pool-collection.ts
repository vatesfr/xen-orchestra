import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoPool } from '@vates/types'
import { useSorted } from '@vueuse/core'

const poolFields: (keyof XoPool)[] = [
  'id',
  'name_label',
  'master',
  'default_SR',
  'tags',
  'otherConfig',
  'auto_poweron',
  'HA_enabled',
  'migrationCompression',
  'suspendSr',
  'crashDumpSr',
  'haSrs',
  'type',
] as const

export const useXoPoolCollection = defineRemoteResource({
  url: `/rest/v0/pools?fields=${poolFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'pool', fields: poolFields }),
  initialData: () => [] as XoPool[],
  state: (rawPools, context) => {
    const pools = useSorted(rawPools, sortByNameLabel)

    return useXoCollectionState(pools, {
      context,
      baseName: 'pool',
    })
  },
})
