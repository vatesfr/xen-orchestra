import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
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

  const getHostPowerState = (host: XenApiHost): HOST_POWER_STATE => {
    const live = baseContext.getByOpaqueRef(host.metrics)?.live

    if (live === undefined) {
      return HOST_POWER_STATE.UNKNOWN
    }

    return live ? HOST_POWER_STATE.RUNNING : HOST_POWER_STATE.HALTED
  }

  const isHostRunning = (host: XenApiHost) => getHostPowerState(host) === HOST_POWER_STATE.RUNNING

  const context = {
    ...baseContext,
    getHostMemory,
    getHostPowerState,
    isHostRunning,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
