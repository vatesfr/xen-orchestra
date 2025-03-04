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
  const srsName = (ref: XenApiSr['$ref']) => baseContext.getByOpaqueRef(ref)?.name_label

  const getSrWithISO = computed(() => srs.value.filter(sr => sr.type === 'iso'))

  const concatVidsArray = computed(() => getSrWithISO.value.flatMap(sr => sr.VDIs || []))

  const vdisGroupedBySrName = computed(() => {
    const groupedVdis: Record<string, XenApiSr[]> = {}

    concatVidsArray.value.forEach(vdiRef => {
      const vdi = vdiContext.getByOpaqueRef(vdiRef)

      if (vdi) {
        const srName = srsName(vdi.SR) || 'Unknown SR'
        if (!groupedVdis[srName]) {
          groupedVdis[srName] = []
        }
        groupedVdis[srName].push(vdi)
      }
    })

    return groupedVdis
  })

  const context = {
    ...baseContext,
    vdisGroupedBySrName,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
