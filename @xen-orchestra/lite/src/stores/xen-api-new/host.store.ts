import { createSubscribe } from '@/stores/xen-api-new/create-subscribe'
import { useNewHostMetricsStore } from '@/stores/xen-api-new/host-metrics.store'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNewHostStore = defineStore('host-new', () => {
  const hostMetricsStore = useNewHostMetricsStore()

  const subscribe = createSubscribe('host', [hostMetricsStore], (hostsCtx, metricsCtx) => {
    return {
      runningHosts: computed(() => {
        return hostsCtx.records.value.filter(host => metricsCtx.getByOpaqueRef(host.metrics)?.live === true)
      }),
    }
  })

  return { subscribe }
})
