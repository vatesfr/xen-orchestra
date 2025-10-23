import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoSrCollection = defineRemoteResource({
  url: '/rest/v0/srs?fields=id,name_label,name_description,$pool,content_type,physical_usage,usage,size,SR_type,VDIs,type,shared,sm_config,other_config,tags,allocationStrategy',
  initialData: () => [] as XoSr[],
  state: (rawSrs, context) => {
    const srs = useSorted(rawSrs, (sr1, sr2) => sortByNameLabel(sr1, sr2))

    const { getVdiById } = useXoVdiCollection(context)

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
      }, new Set<XoVdi['id']>())
    )

    const vdiIsosBySrName = computed(() => {
      const groupedVDIs: Record<string, XoVdi[]> = {}

      isoVdiIds.value.forEach(vdiId => {
        const vdi = getVdiById(vdiId)

        if (vdi) {
          const srName = state.getSrById(vdi.$SR)?.name_label ?? 'Unknown SR'

          if (!groupedVDIs[srName]) {
            groupedVDIs[srName] = []
          }

          groupedVDIs[srName].push(vdi)
        }
      })

      return groupedVDIs
    })

    const srsByPool = computed(() => {
      const srsByPoolMap = new Map<XoPool['id'], XoSr[]>()

      srs.value.forEach(sr => {
        const poolId = sr.$pool

        if (!srsByPoolMap.has(poolId)) {
          srsByPoolMap.set(poolId, [])
        }

        srsByPoolMap.get(poolId)!.push(sr)
      })

      return srsByPoolMap
    })

    return {
      ...state,
      vdiIsosBySrName,
      srsByPool,
    }
  },
})
