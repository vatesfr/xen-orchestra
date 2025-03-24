import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useSrStore = defineStore('xen-api-sr', () => {
  const deps = {
    vdiStore: useVdiStore(),
  }

  const vdiContext = deps.vdiStore.getContext()

  const { context: baseContext, ...configRest } = createXapiStoreConfig('sr')

  const srs = computed(() => baseContext.records.value)

  const getSrsName = (ref: XenApiSr['$ref']) => baseContext.getByOpaqueRef(ref)?.name_label

  const getSrsWithISO = computed(() => srs.value.filter(sr => sr.type === 'iso'))

  const concatVdisArray = computed(() => getSrsWithISO.value.flatMap(sr => sr.VDIs || []))

  const vdisBySrName = computed(() => {
    const groupedVDIs: Record<string, XenApiSr[]> = {}

    concatVdisArray.value.forEach(vdiRef => {
      const vdi = vdiContext.getByOpaqueRef(vdiRef)

      if (vdi) {
        const srName = getSrsName(vdi.SR) || 'Unknown SR'
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
    vdisBySrName,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
