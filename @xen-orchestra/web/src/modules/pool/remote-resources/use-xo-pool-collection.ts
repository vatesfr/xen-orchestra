import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoPool } from '@vates/types'
import { useSorted } from '@vueuse/core'

export type FrontXoPool = Pick<XoPool, (typeof poolFields)[number]>

const poolFields = [
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
] as const satisfies readonly (keyof XoPool)[]

export const useXoPoolCollection = defineRemoteResource({
  url: `${BASE_URL}/pools?fields=${poolFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'pool', fields: poolFields }),
  initialData: () => [] as FrontXoPool[],
  state: (rawPools, context) => {
    const pools = useSorted(rawPools, sortByNameLabel)

    return useXoCollectionState(pools, {
      context,
      baseName: 'pool',
    })
  },
})
