import { useVdiStore } from '@/stores/xo-rest-api/vdi.store'
import type { XoSr } from '@/types/xo/sr.type'
import type { XoVdi } from '@/types/xo/vdi.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useSrStore = defineStore('sr', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('sr')

  const deps = {
    vdiStore: useVdiStore(),
  }
  const vdiContext = deps.vdiStore.getContext()

  const srs = computed(() => baseContext.records.value)
  const getSrName = (id: XoSr['id']) => baseContext.get(id)?.name_label

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
      const vdi = vdiContext.get(vdiId)

      if (vdi) {
        const srName = getSrName(vdi.$SR) || 'Unknown SR'
        if (!groupedVDIs[srName]) {
          groupedVDIs[srName] = []
        }
        groupedVDIs[srName].push(vdi)
      }
    })

    return groupedVDIs
  })

  const context = {
    ...baseContext,
    vdiIsosBySrName,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
