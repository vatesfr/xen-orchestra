import { useVdiStore } from '@/stores/xo-rest-api/vdi.store'
import type { XoSr } from '@/types/xo/sr.type'
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
  const srsName = (ref: XoSr['id']) => baseContext.get(ref)?.name_label

  const getSrWithISO = computed(() => srs.value.filter(sr => sr.SR_type === 'iso'))

  const concatVDIsArray = computed(() => getSrWithISO.value.flatMap(sr => sr.VDIs || []))

  const VDIsGroupedBySrName = computed(() => {
    const groupedVDIs: Record<string, XoSr[]> = {}

    concatVDIsArray.value.forEach(vdiRef => {
      const vdi = vdiContext.get(vdiRef)

      if (vdi) {
        const srName = srsName(vdi.$SR) || 'Unknown SR'
        if (!groupedVDIs[srName]) {
          groupedVDIs[srName] = []
        }
        groupedVDIs[srName].push(vdi as any)
      }
    })

    return groupedVDIs
  })

  const context = {
    ...baseContext,
    VDIsGroupedBySrName,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
