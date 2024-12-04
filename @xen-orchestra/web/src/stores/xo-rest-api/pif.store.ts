import type { XoHost } from '@/types/xo/host.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('pif', () => {
  const { context: baseContext, ...restConfig } = createXoStoreConfig('pif')
  const pifsByHost = computed<Map<string, XoPif[]>>(() => {
    const pifsByHostMap = new Map<XoHost['id'], XoPif[]>()

    baseContext.records.value.forEach(pif => {
      const hostId = pif.$host
      if (!pifsByHostMap.has(hostId)) {
        pifsByHostMap.set(hostId, [])
      }

      pifsByHostMap.get(hostId)!.push(pif)
    })
    return pifsByHostMap
  })
  const context = {
    ...baseContext,
    pifsByHost,
  }
  return createSubscribableStoreContext({ context, ...restConfig }, {})
})
