import type { GetStats } from '@/composables/fetch-stats.composable'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('xen-api-host', () => {
  const deps = { metrics: useHostMetricsStore() }
  const xenApiStore = useXenApiStore()

  const { context: baseContext, ...configRest } = createXapiStoreConfig('host')

  const runningHosts = computed(() =>
    baseContext.records.value.filter(host => deps.metrics.$context.isHostRunning(host))
  )

  const getStats = ((hostUuid, granularity, ignoreExpired = false, { abortSignal }) => {
    const host = baseContext.getByUuid(hostUuid)

    if (host === undefined) {
      throw new Error(`Host ${hostUuid} could not be found.`)
    }

    const xapiStats = xenApiStore.isConnected ? xenApiStore.getXapiStats() : undefined

    return xapiStats?._getAndUpdateStats({
      abortSignal,
      host,
      ignoreExpired,
      uuid: host.uuid,
      granularity,
    })
  }) as GetStats<XenApiHost>

  const context = {
    ...baseContext,
    runningHosts,
    getStats,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
