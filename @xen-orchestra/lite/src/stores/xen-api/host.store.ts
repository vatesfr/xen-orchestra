import type { GetStats } from '@/composables/fetch-stats.composable.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('xen-api-host', () => {
  const deps = { metricsStore: useHostMetricsStore() }

  const metricsContext = deps.metricsStore.getContext()

  const xenApiStore = useXenApiStore()

  const { context: baseContext, ...configRest } = createXapiStoreConfig('host', {
    sortBy: (host1, host2) => sortByNameLabel(host1, host2),
  })

  const runningHosts = computed(() => baseContext.records.value.filter(host => metricsContext.isHostRunning(host)))

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
