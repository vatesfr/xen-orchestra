import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVdiCollection, type FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { AnyXoVdi, XoPool, XoSr, XoVdi } from '@vates/types'
import { reactify, useSorted } from '@vueuse/core'
import { computed } from 'vue'

export type FrontXoSr = Pick<XoSr, (typeof srFields)[number]>

const srFields = [
  'id',
  'name_label',
  'name_description',
  '$pool',
  'content_type',
  'physical_usage',
  'usage',
  'size',
  'SR_type',
  'VDIs',
  'type',
  'shared',
  'sm_config',
  'other_config',
  'tags',
  'allocationStrategy',
  '$PBDs',
] as const satisfies readonly (keyof XoSr)[]

export const useXoSrCollection = defineRemoteResource({
  url: `${BASE_URL}/srs?fields=${srFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'SR', fields: srFields }),
  initialData: () => [] as FrontXoSr[],
  state: (rawSrs, context) => {
    const srs = useSorted(rawSrs, (sr1, sr2) => sortByNameLabel(sr1, sr2))

    const { getVdiById } = useXoVdiCollection(context)
    const { getPoolById } = useXoPoolCollection()

    const state = useXoCollectionState(srs, {
      context,
      baseName: 'sr',
    })

    const isoSrs = computed(() => srs.value.filter(sr => sr.SR_type === 'iso'))

    const isoVdiIds = computed(() =>
      isoSrs.value.reduce((acc, sr) => {
        if (sr.VDIs) {
          sr.VDIs.forEach(vdiId => acc.add(vdiId))
        }

        return acc
      }, new Set<AnyXoVdi['id']>())
    )

    const vdiIsosBySrName = computed(() => {
      const groupedVDIs: Record<string, FrontXoVdi[]> = {}

      isoVdiIds.value.forEach(vdiId => {
        const vdi = getVdiById(vdiId as XoVdi['id'])

        if (!vdi) {
          return
        }

        const srName = state.getSrById(vdi.$SR)?.name_label ?? 'Unknown SR'

        if (!groupedVDIs[srName]) {
          groupedVDIs[srName] = []
        }

        groupedVDIs[srName].push(vdi)
      })

      return groupedVDIs
    })

    const srsByPool = computed(() => {
      const srsByPoolMap = new Map<XoPool['id'], FrontXoSr[]>()

      srs.value.forEach(sr => {
        const poolId = sr.$pool

        if (!srsByPoolMap.has(poolId)) {
          srsByPoolMap.set(poolId, [])
        }

        srsByPoolMap.get(poolId)!.push(sr)
      })

      return srsByPoolMap
    })

    const isDefaultSr = (sr: FrontXoSr) => getPoolById(sr.$pool)?.default_SR === sr.id

    const isHighAvailabilitySr = reactify((sr: FrontXoSr) => {
      const srPool = getPoolById(sr.$pool)

      return srPool?.haSrs?.includes(sr.id) ?? false
    })

    return {
      ...state,
      vdiIsosBySrName,
      srsByPool,
      isDefaultSr,
      isHighAvailabilitySr,
    }
  },
})
