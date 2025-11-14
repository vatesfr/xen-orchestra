import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { AnyXoVdi, XoSr, XoVdi } from '@vates/types'
import { computed } from 'vue'

export const useXoSrCollection = defineRemoteResource({
  url: '/rest/v0/srs?fields=id,name_label,name_description,$pool,content_type,physical_usage,size,SR_type,VDIs,type',
  initialData: () => [] as XoSr[],
  state: (srs, context) => {
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
      }, new Set<AnyXoVdi['id']>())
    )

    const vdiIsosBySrName = computed(() => {
      const groupedVDIs: Record<string, XoVdi[]> = {}

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

    return {
      ...state,
      vdiIsosBySrName,
    }
  },
})
