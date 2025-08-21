import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import type { XenApiSr, XenApiVdi } from '@vates/types'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useSrStore = defineStore('xen-api-sr', () => {
  const deps = {
    vdiStore: useVdiStore(),
  }

  const vdiContext = deps.vdiStore.getContext()

  const { context: baseContext, ...configRest } = createXapiStoreConfig('sr')

  const srs = computed(() => baseContext.records.value)

  const isoSrs = computed(() => srs.value.filter(sr => sr.type === 'iso'))

  const concatVdisArray = computed(() =>
    isoSrs.value.reduce((acc, sr) => {
      if (sr.VDIs) {
        sr.VDIs.forEach(vdiRef => acc.add(vdiRef))
      }

      return acc
    }, new Set<XenApiVdi['$ref']>())
  )

  // TODO remove when the select component is ready to use
  const getSrName = (ref: XenApiSr['$ref']) => baseContext.getByOpaqueRef(ref)?.name_label

  const vdiIsosBySrName = computed(() => {
    const groupedVdis: Record<string, XenApiVdi[]> = {}

    concatVdisArray.value.forEach(vdiRef => {
      const vdi = vdiContext.getByOpaqueRef(vdiRef)

      if (vdi) {
        const srName = getSrName(vdi.SR) || 'Unknown SR'
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
    vdiIsosBySrName,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
