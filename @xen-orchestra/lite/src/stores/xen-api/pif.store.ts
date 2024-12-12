import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const usePifStore = defineStore('xen-api-pif', () => {
  const route = useRoute()

  const deps = {
    hostStore: useHostStore(),
    metricsStore: useHostMetricsStore(),
  }

  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const hostContext = deps.hostStore.getContext()

  const currentHostPifs = computed(() => {
    const currentHostUuid = route.params.uuid as XenApiHost['uuid']

    return baseContext.records.value.filter(pif => {
      const host = hostContext.getByOpaqueRef(pif.host)
      return host?.uuid === currentHostUuid
    })
  })

  const context = {
    ...baseContext,
    currentHostPifs,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
