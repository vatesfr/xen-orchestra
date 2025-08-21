import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import type { XenApiPif } from '@vates/types'
import { defineStore } from 'pinia'

export const usePifMetricsStore = defineStore('xen-api-pif-metrics', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif_metrics')

  const getPifCarrier = (pif: XenApiPif) => baseContext.getByOpaqueRef(pif.metrics)?.carrier

  const context = {
    ...baseContext,
    getPifCarrier,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
