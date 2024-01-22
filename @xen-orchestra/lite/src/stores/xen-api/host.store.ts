import type { GetStats } from '@/composables/fetch-stats.composable'
import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import type { XenApiPatch } from '@/types/xen-api'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('xen-api-host', () => {
  const hostMetricsStore = useHostMetricsStore()

  const context = useXenApiStoreSubscribableContext('host', [hostMetricsStore])

  const runningHosts = computed(() => context.records.value.filter(host => hostMetricsStore.isHostRunning(host)))

  const getStats = ((hostUuid, granularity, ignoreExpired = false, { abortSignal }) => {
    const xenApiStore = useXenApiStore()
    const host = context.getByUuid(hostUuid)

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

  const fetchMissingPatches = async (hostRef: XenApiHost['$ref']): Promise<XenApiPatch[]> => {
    const xenApiStore = useXenApiStore()

    const rawPatchesAsString = await xenApiStore
      .getXapi()
      .call<string>('host.call_plugin', [hostRef, 'updater.py', 'check_update', {}])

    const rawPatches = JSON.parse(rawPatchesAsString) as Omit<XenApiPatch, '$id'>[]

    return rawPatches.map(rawPatch => ({
      ...rawPatch,
      $id: `${rawPatch.name}-${rawPatch.version}`,
    }))
  }

  return {
    ...context,
    runningHosts,
    getStats,
    fetchMissingPatches,
  }
})

export const useHostCollection = createUseCollection(useHostStore)
