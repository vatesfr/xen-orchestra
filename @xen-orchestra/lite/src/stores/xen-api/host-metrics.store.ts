import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useHostMetricsStore = defineStore('xen-api-host-metrics', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('host_metrics')

  const getHostMemory = (host: XenApiHost) => {
    const hostMetrics = baseContext.getByOpaqueRef(host.metrics)

    if (hostMetrics !== undefined) {
      const total = +hostMetrics.memory_total
      return {
        usage: total - +hostMetrics.memory_free,
        size: total,
      }
    }
  }

  const isHostRunning = (host: XenApiHost) => {
    return baseContext.getByOpaqueRef(host.metrics)?.live === true
  }

  const isHostHalted = (host: XenApiHost) => {
    return baseContext.getByOpaqueRef(host.metrics)?.live === false
  }

  const context = {
    ...baseContext,
    getHostMemory,
    isHostRunning,
    isHostHalted,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
