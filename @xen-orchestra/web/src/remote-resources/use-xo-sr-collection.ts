import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoSrCollection = defineRemoteResource({
  url: '/rest/v0/srs?fields=id,name_label,name_description,$pool,content_type,physical_usage,size,SR_type,VDIs',
  initialData: () => [] as XoSr[],
  state: (srs, context) => {
    const { getVdiById } = useXoVdiCollection(context)

    const state = useXoCollectionState(srs, {
      context,
      baseName: 'sr',
    })

    const isoVdiIds = computed(() =>
      srs.value.reduce((acc, sr) => {
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

    return {
      ...state,
      vdiIsosBySrName,
    }
  },
})
