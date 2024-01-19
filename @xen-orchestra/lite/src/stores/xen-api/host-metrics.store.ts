import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useHostMetricsStore = defineStore('xen-api-host-metrics', () => {
  const context = useXenApiStoreSubscribableContext('host_metrics')

  const getHostMemory = (host: XenApiHost) => {
    const hostMetrics = context.getByOpaqueRef(host.metrics)

    if (hostMetrics !== undefined) {
      const total = +hostMetrics.memory_total
      return {
        usage: total - +hostMetrics.memory_free,
        size: total,
      }
    }
  }

  const isHostRunning = (host: XenApiHost) => {
    return context.getByOpaqueRef(host.metrics)?.live === true
  }

  return {
    ...context,
    getHostMemory,
    isHostRunning,
  }
})

export const useHostMetricsCollection = createUseCollection(useHostMetricsStore)
