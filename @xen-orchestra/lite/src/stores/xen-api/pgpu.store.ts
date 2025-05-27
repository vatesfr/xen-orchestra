import type { XenApiHost, XenApiPgpu } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePgpuStore = defineStore('xen-api-pgpu', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pgpu')

  const pGpusByHost = computed(() => {
    const pGpusByHostMap = new Map<XenApiHost['$ref'], XenApiPgpu[]>()

    baseContext.records.value.forEach(pGpu => {
      const hostId = pGpu.host

      if (!pGpusByHostMap.has(hostId)) {
        pGpusByHostMap.set(hostId, [])
      }

      pGpusByHostMap.get(hostId)!.push(pGpu)
    })

    return pGpusByHostMap
  })

  const context = {
    ...baseContext,
    pGpusByHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
